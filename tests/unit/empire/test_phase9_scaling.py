import asyncio

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.endpoints.empire import router
from src.empire.graph import RuleLLM
from src.empire.metering import Metering
from src.empire.onboarding import Proposal
from src.empire.platform import EmpirePlatform
from src.empire.scaling import JobStatus, ScalingEngine, WorkerState


class Clock:
    """Advances `step` seconds on every read."""

    def __init__(self, step: float = 0.0) -> None:
        self.now, self.step = 1000.0, step

    def __call__(self) -> float:
        self.now += self.step
        return self.now


def _live(p: EmpirePlatform, name: str, tier: str = "pilot") -> str:
    t = p.onboarding.accept(Proposal(name, f"ops@{name.lower()}.test", tier=tier))
    p.onboarding.run_to_live(t.id)
    return t.id


def _engine(p: EmpirePlatform, clock: Clock | None = None, **policy) -> ScalingEngine:
    p.scaling = ScalingEngine(p, clock=clock or Clock())
    if policy:
        p.scaling.set_policy(**policy)
    return p.scaling


def test_scales_from_zero_and_reserves_factory_capacity():
    p = EmpirePlatform()
    tid = _live(p, "Acme")
    eng = _engine(p)
    free_before = p.factory.pools["local-cpu"].free_cpus
    assert eng.tick()["workers"] == 0  # scale-to-zero with no work
    for i in range(9):
        eng.submit(tid, f"blueprints then pools {i}")
    assert eng.desired_workers() == 3  # ceil(9 / 4)
    out = eng.tick()
    assert len(out["scale"]["spawned"]) == 3 and len(out["dispatched"]) == 3
    assert p.factory.pools["local-cpu"].free_cpus == free_before - 3
    assert eng.drain() >= 1 and eng.queued() == 0
    assert all(j.status is JobStatus.SUCCEEDED for j in eng.jobs.values())
    assert p.metering.accounts[tid].usage["agent_run"] == 9


def test_weighted_fair_share_across_tiers():
    p = EmpirePlatform()
    r, pi = _live(p, "Retain", "retainer"), _live(p, "Pilot")
    eng = _engine(p, max_workers=5, jobs_per_worker=1)
    for i in range(10):
        eng.submit(r, f"pools {i}")
        eng.submit(pi, f"pools {i}")
    first = eng.tick()["dispatched"]
    by = [eng.jobs[j].tenant_id for j in first]
    assert len(first) == 5 and by.count(r) == 3 and by.count(pi) == 2


def test_lone_tenant_is_not_throttled_by_tier_cap():
    p = EmpirePlatform()
    s = _live(p, "Solo", "strategy")  # cap 1/tick when contended
    eng = _engine(p, max_workers=4, jobs_per_worker=1)
    for i in range(4):
        eng.submit(s, f"pools {i}")
    assert len(eng.tick()["dispatched"]) == 4


def test_priority_order_within_tenant():
    p = EmpirePlatform()
    tid = _live(p, "Acme")
    eng = _engine(p, max_workers=1)
    low = eng.submit(tid, "pools", priority=1)
    high = eng.submit(tid, "pools", priority=9)
    mid = eng.submit(tid, "pools", priority=5)
    eng.drain()
    order = [row["job_id"] for row in eng.ledger]
    assert order == [high.id, mid.id, low.id]


def test_capacity_limits_are_respected():
    p = EmpirePlatform()
    tid = _live(p, "Acme")  # onboarding already holds 1 of 8 cpus
    eng = _engine(p, worker_cpus=4, jobs_per_worker=1)
    for _ in range(6):
        eng.submit(tid, "pools")
    out = eng.tick()
    assert len(out["scale"]["spawned"]) == 1 and out["scale"]["capacity_blocked"]
    assert eng.drain() >= 1  # still completes on the one worker


def test_idle_workers_reaped_after_ttl_and_capacity_released():
    clock = Clock()
    p = EmpirePlatform()
    tid = _live(p, "Acme")
    free = p.factory.pools["local-cpu"].free_cpus
    eng = _engine(p, clock, idle_ttl_s=60, jobs_per_worker=1)
    for _ in range(3):
        eng.submit(tid, "pools")
    eng.drain()
    assert len(eng.active_workers()) == 3
    assert eng.tick()["scale"]["reaped"] == []  # still inside TTL
    clock.now += 61
    assert len(eng.tick()["scale"]["reaped"]) == 3
    assert eng.active_workers() == []
    assert p.factory.pools["local-cpu"].free_cpus == free
    assert all(w.state is WorkerState.STOPPED for w in eng.workers.values())


def test_cost_attribution_ledger_and_invoice():
    p = EmpirePlatform()
    a, b = _live(p, "Alpha"), _live(p, "Beta")
    eng = _engine(p, Clock(step=1.0), worker_cpus=2, max_workers=2, jobs_per_worker=1)
    for _ in range(3):
        eng.submit(a, "pools")
    eng.submit(b, "pools")
    eng.drain()
    rep = eng.attribution(a)
    assert rep["jobs"] == 3 and rep["succeeded"] == 3
    assert rep["cpu_seconds"] == 6.0 and rep["billed_cpu_seconds"] == 6
    assert sum(w["jobs"] for w in rep["by_worker"].values()) == 3
    assert rep["by_pool"]["local-cpu"]["cpu_seconds"] == 6.0
    assert p.metering.accounts[a].usage["cpu_second"] == 6
    assert eng.attribution(b)["jobs"] == 1  # no cross-tenant bleed
    assert rep["invoice_total_usd"] == 1500.0  # inside included cpu-hours


def test_cpu_second_overage_pricing():
    m = Metering()
    m.open_account("t", "pilot")
    m.record("t", "cpu_second", 37_000)
    lines = m.invoice("t")["lines"]
    assert lines[1] == {"description": "cpu_second overage", "qty": 1000,
                        "unit_usd": 0.0005, "amount_usd": 0.5}


def test_rejects_unknown_and_non_live_tenants_and_bad_input():
    p = EmpirePlatform()
    eng = p.scaling
    with pytest.raises(KeyError):
        eng.submit("ten_nope", "pools")
    t = p.onboarding.accept(Proposal("Early", "a@b.co"))
    with pytest.raises(ValueError, match="not live"):
        eng.submit(t.id, "pools")
    tid = _live(p, "Acme")
    with pytest.raises(ValueError):
        eng.submit(tid, "   ")
    with pytest.raises(ValueError):
        eng.submit(tid, "pools", priority=10)
    with pytest.raises(ValueError):
        eng.set_policy(min_workers=5, max_workers=2)


class ActFails(RuleLLM):
    def complete(self, prompt):
        if prompt.startswith("ACT:"):
            raise RuntimeError("model offline")
        return super().complete(prompt)


def test_failed_agent_job_is_recorded_and_still_metered():
    p = EmpirePlatform(llm=ActFails())
    tid = _live(p, "Acme")
    eng = _engine(p)
    job = eng.submit(tid, "summarise the contract")
    eng.drain()
    assert job.status is JobStatus.FAILED and job.billed_cpu_seconds == 1
    assert eng.attribution(tid)["failed"] == 1


def test_scaling_events_are_on_the_audit_chain():
    p = EmpirePlatform()
    tid = _live(p, "Acme")
    p.scaling.submit(tid, "pools")
    p.scaling.drain()
    actions = {e.action for e in p.audit.events}
    assert {"scaling.job_submitted", "scaling.worker_spawned",
            "scaling.job_finished"} <= actions
    assert p.audit.verify() == (True, None)
    assert p.snapshot()["scaling"]["workers"] == 1


def test_run_loop_processes_queue_until_stopped():
    p = EmpirePlatform()
    tid = _live(p, "Acme")
    for _ in range(3):
        p.scaling.submit(tid, "pools")

    async def go():
        stop = asyncio.Event()
        task = asyncio.create_task(p.scaling.run_loop(0.01, stop))
        for _ in range(100):
            await asyncio.sleep(0.01)
            if not p.scaling.queued():
                break
        stop.set()
        await task

    asyncio.run(go())
    assert p.scaling.queued() == 0


def test_scaling_api_and_tenant_isolation():
    app = FastAPI()
    app.include_router(router)
    c = TestClient(app)

    def onboard(name):
        b = c.post("/api/v1/empire/onboarding", json={
            "client_name": name, "contact_email": f"it@{name.lower()}.test",
            "run_to_live": True}).json()
        return b["tenant"]["id"], {"X-Tenant-Key": b["tenant_api_key"]}

    a_id, a_key = onboard("Alpha")
    _, b_key = onboard("Beta")

    r = c.post("/api/v1/empire/tenant/jobs", json={"goal": "pools", "priority": 7},
               headers=a_key)
    assert r.status_code == 202 and r.json()["status"] == "queued"
    job_id = r.json()["id"]
    assert c.post("/api/v1/empire/tenant/jobs", json={"goal": "x"}).status_code == 401

    assert c.get("/api/v1/empire/scaling/status").json()["queued"] == 1
    tick = c.post("/api/v1/empire/scaling/tick").json()
    assert tick["dispatched"] == [job_id]

    mine = c.get(f"/api/v1/empire/tenant/jobs/{job_id}", headers=a_key)
    assert mine.status_code == 200 and mine.json()["status"] == "succeeded"
    assert c.get(f"/api/v1/empire/tenant/jobs/{job_id}", headers=b_key).status_code == 404
    assert c.get("/api/v1/empire/tenant/jobs", headers=b_key).json() == []

    att = c.get(f"/api/v1/empire/scaling/attribution/{a_id}").json()
    assert att["jobs"] == 1 and att["billed_cpu_seconds"] >= 1
    assert c.get("/api/v1/empire/scaling/attribution/ten_nope").status_code == 404

    assert c.post("/api/v1/empire/scaling/jobs", json={
        "tenant_id": "ten_nope", "goal": "pools"}).status_code == 404
    assert c.put("/api/v1/empire/scaling/policy",
                 json={"max_workers": 3}).json()["max_workers"] == 3
    assert c.put("/api/v1/empire/scaling/policy",
                 json={"min_workers": 9, "max_workers": 3}).status_code == 422
    assert c.put("/api/v1/empire/scaling/policy",
                 json={"pool": "aws-gpu"}).status_code == 422
