"""Phase 9 — agentic scaling layer.

Multi-tenant job scheduling, elastic worker pools and cost attribution, built on
the existing phases rather than beside them:

* **Workers are real AI Factory deployments.** Spawning a worker reserves CPU in
  a compute pool via ``AIFactory.deploy``; reaping it releases the CPU via
  ``AIFactory.teardown``. Scaling can never exceed pool capacity.
* **Every job is the Phase 4 agent.** A job runs ``EmpirePlatform.run_agent``
  (plan -> act -> check), so it is metered as ``agent_run`` and audited exactly
  like a direct call. A fresh agent is built per job; no state crosses tenants.
* **Cost attribution feeds the Phase 7 invoice.** Each job's CPU-seconds are
  metered as ``cpu_second`` (min 1 per job) and written to a ledger keyed by
  tenant / worker / pool.

Fair share: smooth weighted round-robin across tenants by tier (retainer 3,
pilot 2, strategy 1) with a per-tick cap per tenant that only binds while other
tenants are waiting (work-conserving), and priority (0–9, high first) within a
tenant.

``tick()`` is one control-loop step (autoscale, then dispatch). ``run_loop``
drives it on an interval in production (``EMPIRE_SCALING_INTERVAL``). The clock
is injectable so tests are deterministic.
"""

from __future__ import annotations

import asyncio
import math
import threading
import time
import uuid
from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass, fields, replace
from enum import Enum
from typing import TYPE_CHECKING, Any

from src.empire.factory import CapacityError
from src.empire.onboarding import Stage, Tier

if TYPE_CHECKING:
    from src.empire.platform import EmpirePlatform

TIER_WEIGHT: dict[Tier, int] = {Tier.STRATEGY: 1, Tier.PILOT: 2, Tier.RETAINER: 3}
TIER_MAX_PER_TICK: dict[Tier, int] = {Tier.STRATEGY: 1, Tier.PILOT: 2, Tier.RETAINER: 4}
WORKER_APP_NAME = "nova-scaler-worker"


class WorkerState(str, Enum):
    IDLE = "idle"
    BUSY = "busy"
    STOPPED = "stopped"


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


@dataclass
class ScalingPolicy:
    min_workers: int = 0  # scale to zero when idle
    max_workers: int = 6
    jobs_per_worker: int = 4  # target backlog per worker
    idle_ttl_s: float = 120.0  # idle time before a surplus worker is reaped
    worker_cpus: int = 1
    pool: str = "local-cpu"
    environment: str = "staging"

    def __post_init__(self) -> None:
        if not 0 <= self.min_workers <= self.max_workers:
            raise ValueError("require 0 <= min_workers <= max_workers")
        if self.jobs_per_worker < 1 or self.worker_cpus < 1:
            raise ValueError("jobs_per_worker and worker_cpus must be >= 1")
        if self.idle_ttl_s < 0:
            raise ValueError("idle_ttl_s must be >= 0")

    def to_dict(self) -> dict[str, Any]:
        return {f.name: getattr(self, f.name) for f in fields(self)}


@dataclass
class Worker:
    id: str
    deployment_id: str
    pool: str
    cpus: int
    created_at: float
    idle_since: float
    state: WorkerState = WorkerState.IDLE
    jobs_run: int = 0
    busy_seconds: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "deployment_id": self.deployment_id,
            "pool": self.pool,
            "cpus": self.cpus,
            "state": self.state.value,
            "jobs_run": self.jobs_run,
            "busy_seconds": round(self.busy_seconds, 3),
        }


@dataclass
class Job:
    id: str
    tenant_id: str
    goal: str
    priority: int
    seq: int
    submitted_at: float
    status: JobStatus = JobStatus.QUEUED
    worker_id: str | None = None
    started_at: float | None = None
    finished_at: float | None = None
    cpu_seconds: float = 0.0
    billed_cpu_seconds: int = 0
    result: dict[str, Any] | None = None
    error: str | None = None

    def to_dict(self, include_result: bool = True) -> dict[str, Any]:
        d: dict[str, Any] = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "goal": self.goal,
            "priority": self.priority,
            "status": self.status.value,
            "worker_id": self.worker_id,
            "cpu_seconds": self.cpu_seconds,
            "billed_cpu_seconds": self.billed_cpu_seconds,
            "error": self.error,
        }
        if include_result:
            d["result"] = self.result
        return d


class ScalingEngine:
    def __init__(self, platform: EmpirePlatform, policy: ScalingPolicy | None = None,
                 clock: Callable[[], float] = time.monotonic) -> None:
        self.p = platform
        self.policy = policy or ScalingPolicy()
        self.clock = clock
        self.workers: dict[str, Worker] = {}
        self.jobs: dict[str, Job] = {}
        self.ledger: list[dict[str, Any]] = []
        self._queues: dict[str, list[Job]] = defaultdict(list)
        self._wrr: dict[str, float] = defaultdict(float)
        self._seq = 0
        self._app_id: str | None = None
        self._lock = threading.RLock()

    # -- jobs -----------------------------------------------------------
    def submit(self, tenant_id: str, goal: str, priority: int = 5) -> Job:
        t = self.p.onboarding.get(tenant_id)  # KeyError if unknown
        if t.stage is not Stage.LIVE:
            raise ValueError(f"tenant {tenant_id} is not live (stage={t.stage.value})")
        if not goal.strip():
            raise ValueError("goal required")
        if not 0 <= priority <= 9:
            raise ValueError("priority must be 0-9")
        with self._lock:
            self._seq += 1
            job = Job(id=f"job_{uuid.uuid4().hex[:10]}", tenant_id=tenant_id,
                      goal=goal, priority=priority, seq=self._seq,
                      submitted_at=self.clock())
            self.jobs[job.id] = job
            q = self._queues[tenant_id]
            q.append(job)
            q.sort(key=lambda j: (-j.priority, j.seq))
        self.p.audit.record("scaling.job_submitted", tenant_id,
                            {"job_id": job.id, "priority": priority})
        return job

    def get_job(self, job_id: str) -> Job:
        if job_id not in self.jobs:
            raise KeyError(f"unknown job {job_id!r}")
        return self.jobs[job_id]

    def jobs_for(self, tenant_id: str) -> list[Job]:
        return [j for j in self.jobs.values() if j.tenant_id == tenant_id]

    def queued(self, tenant_id: str | None = None) -> int:
        if tenant_id:
            return len(self._queues.get(tenant_id, []))
        return sum(len(q) for q in self._queues.values())

    # -- workers / autoscaling -----------------------------------------
    def active_workers(self) -> list[Worker]:
        return [w for w in self.workers.values() if w.state is not WorkerState.STOPPED]

    def desired_workers(self) -> int:
        backlog = self.queued()
        want = math.ceil(backlog / self.policy.jobs_per_worker) if backlog else 0
        return max(self.policy.min_workers, min(want, self.policy.max_workers))

    def set_policy(self, **changes: Any) -> ScalingPolicy:
        with self._lock:
            self.policy = replace(self.policy, **changes)  # re-validates
        self.p.audit.record("scaling.policy_changed", None, self.policy.to_dict())
        return self.policy

    def autoscale(self) -> dict[str, Any]:
        with self._lock:
            desired = self.desired_workers()
            spawned: list[str] = []
            reaped: list[str] = []
            blocked = False
            while len(self.active_workers()) < desired:
                try:
                    spawned.append(self._spawn().id)
                except CapacityError:
                    blocked = True
                    break
            surplus = len(self.active_workers()) - desired
            if surplus > 0:
                now = self.clock()
                idle = sorted(
                    (w for w in self.active_workers()
                     if w.state is WorkerState.IDLE
                     and now - w.idle_since >= self.policy.idle_ttl_s),
                    key=lambda w: w.idle_since,
                )
                for w in idle[:surplus]:
                    self._reap(w)
                    reaped.append(w.id)
            return {"desired": desired, "spawned": spawned, "reaped": reaped,
                    "capacity_blocked": blocked}

    def _worker_app(self) -> str:
        if self._app_id is None:
            self._app_id = self.p.foundry.scaffold(WORKER_APP_NAME, "agent-workflow").id
        return self._app_id

    def _spawn(self) -> Worker:
        pol = self.policy
        dep = self.p.factory.deploy(self._worker_app(), pol.environment, pol.pool,
                                    pol.worker_cpus)
        now = self.clock()
        w = Worker(id=f"wrk_{uuid.uuid4().hex[:8]}", deployment_id=dep.id,
                   pool=pol.pool, cpus=pol.worker_cpus, created_at=now, idle_since=now)
        self.workers[w.id] = w
        self.p.audit.record("scaling.worker_spawned", None,
                            {"worker_id": w.id, "deployment_id": dep.id, "pool": w.pool})
        return w

    def _reap(self, w: Worker) -> None:
        self.p.factory.teardown(w.deployment_id)
        w.state = WorkerState.STOPPED
        self.p.audit.record("scaling.worker_reaped", None,
                            {"worker_id": w.id, "jobs_run": w.jobs_run})

    # -- fair-share dispatch -------------------------------------------
    def _tier(self, tenant_id: str) -> Tier:
        acct = self.p.metering.accounts.get(tenant_id)
        return acct.tier if acct else self.p.onboarding.get(tenant_id).proposal.tier

    def _next_tenant(self, taken: dict[str, int], capped: bool = True) -> str | None:
        """Smooth weighted round-robin over tenants with work (and quota left)."""
        ready = [tid for tid, q in self._queues.items()
                 if q and (not capped or taken[tid] < TIER_MAX_PER_TICK[self._tier(tid)])]
        if not ready:
            return None
        total = 0
        for tid in ready:
            w = TIER_WEIGHT[self._tier(tid)]
            self._wrr[tid] += w
            total += w
        pick = max(ready, key=lambda tid: (self._wrr[tid], tid))
        self._wrr[pick] -= total
        return pick

    def dispatch(self) -> list[Job]:
        with self._lock:
            idle = sorted((w for w in self.active_workers()
                           if w.state is WorkerState.IDLE), key=lambda w: w.created_at)
            taken: dict[str, int] = defaultdict(int)
            done: list[Job] = []
            for w in idle:
                # work-conserving: tier caps only bind while others are waiting
                tid = self._next_tenant(taken) or self._next_tenant(taken, capped=False)
                if tid is None:
                    break
                job = self._queues[tid].pop(0)
                taken[tid] += 1
                self._run(w, job)
                done.append(job)
            return done

    def _run(self, w: Worker, job: Job) -> None:
        w.state = WorkerState.BUSY
        job.status, job.worker_id = JobStatus.RUNNING, w.id
        job.started_at = self.clock()
        try:
            res = self.p.run_agent(job.goal, job.tenant_id)
            job.result = res
            job.status = JobStatus.SUCCEEDED if res.get("done") else JobStatus.FAILED
        except Exception as exc:  # noqa: BLE001 - recorded on the job
            job.status, job.error = JobStatus.FAILED, str(exc)
        job.finished_at = self.clock()
        elapsed = max(0.0, job.finished_at - job.started_at)
        job.cpu_seconds = round(elapsed * w.cpus, 3)
        job.billed_cpu_seconds = max(1, math.ceil(job.cpu_seconds))
        self.p.metering.record(job.tenant_id, "cpu_second", job.billed_cpu_seconds)
        self.ledger.append({
            "job_id": job.id, "tenant_id": job.tenant_id, "worker_id": w.id,
            "pool": w.pool, "status": job.status.value,
            "cpu_seconds": job.cpu_seconds, "billed_cpu_seconds": job.billed_cpu_seconds,
        })
        w.state, w.idle_since = WorkerState.IDLE, job.finished_at
        w.jobs_run += 1
        w.busy_seconds += elapsed
        self.p.audit.record("scaling.job_finished", job.tenant_id,
                            {"job_id": job.id, "status": job.status.value,
                             "worker_id": w.id,
                             "billed_cpu_seconds": job.billed_cpu_seconds})

    # -- control loop ---------------------------------------------------
    def tick(self) -> dict[str, Any]:
        with self._lock:
            scale = self.autoscale()
            ran = self.dispatch()
            return {"scale": scale, "dispatched": [j.id for j in ran],
                    "queued": self.queued(), "workers": len(self.active_workers())}

    def drain(self, max_ticks: int = 100) -> int:
        """Tick until the queue is empty. Returns ticks used."""
        for n in range(1, max_ticks + 1):
            self.tick()
            if not self.queued():
                return n
        raise RuntimeError(f"queue not drained after {max_ticks} ticks "
                           f"({self.queued()} jobs left)")

    async def run_loop(self, interval_s: float, stop: asyncio.Event) -> None:
        while not stop.is_set():
            await asyncio.to_thread(self.tick)
            try:
                await asyncio.wait_for(stop.wait(), timeout=interval_s)
            except TimeoutError:
                pass

    # -- reporting ------------------------------------------------------
    def attribution(self, tenant_id: str) -> dict[str, Any]:
        self.p.onboarding.get(tenant_id)  # KeyError if unknown
        rows = [r for r in self.ledger if r["tenant_id"] == tenant_id]
        by_worker: dict[str, dict[str, float]] = defaultdict(
            lambda: {"jobs": 0, "cpu_seconds": 0.0})
        by_pool: dict[str, dict[str, float]] = defaultdict(
            lambda: {"jobs": 0, "cpu_seconds": 0.0})
        for r in rows:
            for bucket in (by_worker[r["worker_id"]], by_pool[r["pool"]]):
                bucket["jobs"] += 1
                bucket["cpu_seconds"] = round(bucket["cpu_seconds"] + r["cpu_seconds"], 3)
        return {
            "tenant_id": tenant_id,
            "tier": self._tier(tenant_id).value,
            "jobs": len(rows),
            "succeeded": sum(r["status"] == "succeeded" for r in rows),
            "failed": sum(r["status"] == "failed" for r in rows),
            "queued": self.queued(tenant_id),
            "cpu_seconds": round(sum(r["cpu_seconds"] for r in rows), 3),
            "billed_cpu_seconds": sum(r["billed_cpu_seconds"] for r in rows),
            "by_worker": dict(by_worker),
            "by_pool": dict(by_pool),
            "invoice_total_usd": self.p.metering.invoice(tenant_id)["total_usd"],
        }

    def status(self) -> dict[str, Any]:
        return {
            "policy": self.policy.to_dict(),
            "desired_workers": self.desired_workers(),
            "workers": [w.to_dict() for w in self.active_workers()],
            "queued": self.queued(),
            "queued_by_tenant": {t: len(q) for t, q in self._queues.items() if q},
            "jobs_total": len(self.jobs),
        }
