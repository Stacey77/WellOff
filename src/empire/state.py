"""Deployment support — persist EmpirePlatform state to a JSON file.

Everything an operator would lose on restart is saved: clients (tenants) and
their onboarding history, scaffolded apps, deployments and pool usage, coding
sessions, metering usage, hashed client keys, scaling jobs and the cost ledger.
The audit log already persists itself (``EMPIRE_AUDIT_PATH``).

Scaling *workers* are runtime processes and are not restored: on load, any
deployment that belonged to a worker is stopped and its CPU released, and the
autoscaler spawns fresh workers for whatever jobs are still queued.

Writes are atomic (temp file + rename), so a crash mid-save never corrupts the
previous state.
"""

from __future__ import annotations

import json
import os
import threading
from dataclasses import asdict
from pathlib import Path
from typing import TYPE_CHECKING, Any

from src.empire.auth_mode import ProviderAuth
from src.empire.factory import ComputePool, Deployment, Environment
from src.empire.foundry import ScaffoldedApp
from src.empire.onboarding import Proposal, Stage, Tenant, Tier
from src.empire.scaling import Job, JobStatus, ScalingPolicy
from src.empire.studio import StudioSession

if TYPE_CHECKING:
    from src.empire.platform import EmpirePlatform

STATE_VERSION = 1
_lock = threading.Lock()


def _auth(d: dict[str, Any] | None) -> ProviderAuth | None:
    return ProviderAuth.from_dict(d) if d else None


def dump(p: EmpirePlatform) -> dict[str, Any]:
    s = p.scaling
    return {
        "version": STATE_VERSION,
        "tenants": [
            {
                "id": t.id, "slug": t.slug,
                "proposal": {**asdict(t.proposal), "tier": t.proposal.tier.value,
                             "auth_mode": t.proposal.auth_mode.value},
                "stage": t.stage.value,
                "auth": t.auth.to_dict() if t.auth else None,
                "api_key_hint": t.api_key_hint, "mcp_tools": t.mcp_tools,
                "app_id": t.app_id, "deployment_id": t.deployment_id,
                "history": t.history, "last_error": t.last_error,
            }
            for t in p.onboarding.tenants.values()
        ],
        "tenant_keys": dict(p._tenant_keys),
        "apps": [
            {"id": a.id, "name": a.name, "blueprint": a.blueprint,
             "tenant_id": a.tenant_id, "auth": a.auth.to_dict(), "model": a.model,
             "files": a.files, "created_at": a.created_at}
            for a in p.foundry.apps.values()
        ],
        "pools": [asdict(x) for x in p.factory.pools.values()],
        "deployments": [d.to_dict() for d in p.factory.deployments.values()],
        "sessions": [x.to_dict() for x in p.studio.sessions.values()],
        "accounts": [
            {"tenant_id": a.tenant_id, "tier": a.tier.value, "usage": dict(a.usage)}
            for a in p.metering.accounts.values()
        ],
        "scaling": {
            "policy": s.policy.to_dict(),
            "seq": s._seq,
            "worker_app_id": s._app_id,
            "ledger": s.ledger,
            "jobs": [
                {**j.to_dict(), "seq": j.seq, "submitted_at": j.submitted_at,
                 "started_at": j.started_at, "finished_at": j.finished_at}
                for j in s.jobs.values()
            ],
        },
    }


def load_into(p: EmpirePlatform, data: dict[str, Any]) -> None:
    if data.get("version") != STATE_VERSION:
        raise ValueError(f"unsupported state version {data.get('version')!r}")

    for a in data.get("apps", []):
        p.foundry.apps[a["id"]] = ScaffoldedApp(
            id=a["id"], name=a["name"], blueprint=a["blueprint"],
            tenant_id=a["tenant_id"], auth=ProviderAuth.from_dict(a["auth"]),
            model=a["model"], files=a["files"], created_at=a["created_at"])

    for x in data.get("pools", []):
        p.factory.pools[x["name"]] = ComputePool(**x)
    for d in data.get("deployments", []):
        p.factory.deployments[d["id"]] = Deployment(
            id=d["id"], app_id=d["app_id"], tenant_id=d["tenant_id"],
            environment=Environment(d["environment"]), backend=d["backend"],
            pool=d["pool"], cpus=d["cpus"], status=d["status"],
            created_at=d["created_at"])

    for x in data.get("sessions", []):
        p.studio.sessions[x["id"]] = StudioSession(**x)

    for a in data.get("accounts", []):
        acct = p.metering.open_account(a["tenant_id"], a["tier"])
        acct.usage.update(a["usage"])

    for t in data.get("tenants", []):
        pr = t["proposal"]
        tenant = Tenant(
            id=t["id"], slug=t["slug"],
            proposal=Proposal(**{**pr, "tier": Tier(pr["tier"])}),
            stage=Stage(t["stage"]), auth=_auth(t["auth"]),
            api_key_hint=t["api_key_hint"], mcp_tools=t["mcp_tools"],
            app_id=t["app_id"], deployment_id=t["deployment_id"],
            history=t["history"], last_error=t["last_error"])
        p.onboarding.tenants[tenant.id] = tenant
    p._tenant_keys.update(data.get("tenant_keys", {}))

    sc = data.get("scaling", {})
    s = p.scaling
    if sc.get("policy"):
        s.policy = ScalingPolicy(**sc["policy"])
    s._seq = sc.get("seq", 0)
    s._app_id = sc.get("worker_app_id")
    s.ledger = list(sc.get("ledger", []))
    for j in sc.get("jobs", []):
        job = Job(id=j["id"], tenant_id=j["tenant_id"], goal=j["goal"],
                  priority=j["priority"], seq=j["seq"],
                  submitted_at=j["submitted_at"], status=JobStatus(j["status"]),
                  worker_id=j["worker_id"], started_at=j["started_at"],
                  finished_at=j["finished_at"], cpu_seconds=j["cpu_seconds"],
                  billed_cpu_seconds=j["billed_cpu_seconds"], result=j.get("result"),
                  error=j["error"])
        if job.status is JobStatus.RUNNING:  # interrupted by the restart: run again
            job.status, job.worker_id, job.started_at = JobStatus.QUEUED, None, None
        s.jobs[job.id] = job
        if job.status is JobStatus.QUEUED:
            s._queues[job.tenant_id].append(job)
    for q in s._queues.values():
        q.sort(key=lambda j: (-j.priority, j.seq))

    # Workers don't survive a restart: release the capacity they held.
    if s._app_id:
        for dep in p.factory.deployments.values():
            if dep.app_id == s._app_id and dep.status != "stopped":
                p.factory.teardown(dep.id)


def save(p: EmpirePlatform, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with _lock:
        body = json.dumps(dump(p), default=str, indent=1)
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(body, encoding="utf-8")
        os.replace(tmp, path)


def load(p: EmpirePlatform, path: str | Path) -> bool:
    """Load state if the file exists. Returns True when something was loaded."""
    path = Path(path)
    if not path.exists():
        return False
    load_into(p, json.loads(path.read_text(encoding="utf-8")))
    return True
