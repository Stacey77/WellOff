from fastapi.testclient import TestClient

from src.empire.graph import FallbackLLM, RuleLLM
from src.empire.onboarding import Proposal, Stage
from src.empire.platform import EmpirePlatform
from src.empire.server import create_app

ADMIN = {"X-API-Key": "op-secret"}


def _client(tmp_path, admin_key="op-secret"):
    p = EmpirePlatform(audit_path=tmp_path / "audit.jsonl",
                       state_path=tmp_path / "state.json")
    return TestClient(create_app(p, admin_key=admin_key)), p


def test_state_survives_restart(tmp_path):
    p = EmpirePlatform(audit_path=tmp_path / "a.jsonl", state_path=tmp_path / "s.json")
    t = p.onboarding.accept(Proposal("River Clinic", "it@river.test", tier="retainer"))
    t, key = p.onboarding.run_to_live(t.id)
    p.scaling.submit(t.id, "pools")
    p.scaling.drain()
    p.scaling.submit(t.id, "blueprints", priority=8)  # still queued at shutdown
    free = p.factory.pools["local-cpu"].free_cpus
    p.persist()

    q = EmpirePlatform(audit_path=tmp_path / "a.jsonl", state_path=tmp_path / "s.json")
    assert q.restored
    t2 = q.onboarding.get(t.id)
    assert t2.stage is Stage.LIVE and t2.proposal.tier.value == "retainer"
    assert q.tenant_for_key(key) == t.id
    assert t2.app_id in q.foundry.apps and t2.deployment_id in q.factory.deployments
    assert q.metering.accounts[t.id].usage["agent_run"] == 1
    assert q.deployer.render(t2)["podman-compose.yml"]
    # worker capacity released on restart, client deployment kept
    assert q.factory.pools["local-cpu"].free_cpus == free + 1
    assert q.scaling.active_workers() == []
    assert q.scaling.queued(t.id) == 1
    q.scaling.drain()
    assert q.scaling.attribution(t.id)["jobs"] == 2
    assert q.audit.verify() == (True, None)


def test_operator_routes_need_admin_key_and_tenant_routes_dont(tmp_path):
    c, _ = _client(tmp_path)
    assert c.get("/health").status_code == 200
    assert c.get("/api/v1/empire/snapshot").status_code == 401
    assert c.get("/api/v1/empire/snapshot",
                 headers={"X-API-Key": "wrong"}).status_code == 401
    r = c.post("/api/v1/empire/onboarding", headers=ADMIN, json={
        "client_name": "Blue Oak", "contact_email": "a@b.co", "run_to_live": True})
    assert r.status_code == 201
    key = r.json()["tenant_api_key"]
    me = c.get("/api/v1/empire/tenant/me", headers={"X-Tenant-Key": key})
    assert me.status_code == 200
    assert c.get("/api/v1/empire/tenant/me").status_code == 401


def test_writes_autosave_and_ready_reports(tmp_path):
    c, p = _client(tmp_path)
    assert not (tmp_path / "state.json").exists()
    c.post("/api/v1/empire/onboarding", headers=ADMIN, json={
        "client_name": "Acme", "contact_email": "a@b.co", "run_to_live": True})
    assert (tmp_path / "state.json").exists()
    rd = c.get("/ready").json()
    assert rd["status"] == "ready" and rd["tenants"] == 1 and rd["operator_auth"]
    assert rd["llm"]["provider"] == "rule"


def test_open_mode_without_admin_key(tmp_path):
    c, _ = _client(tmp_path, admin_key="")
    assert c.get("/api/v1/empire/snapshot").status_code == 200
    assert c.get("/ready").json()["operator_auth"] is False


def test_fallback_llm_keeps_agent_working_when_model_is_down():
    class Down:
        def complete(self, prompt):
            raise ConnectionError("ollama not up")

    llm = FallbackLLM(Down(), RuleLLM())
    p = EmpirePlatform(llm=llm)
    out = p.run_agent("blueprints then pools")
    assert out["done"] and llm.last_source == "fallback"


def test_from_env(monkeypatch, tmp_path):
    monkeypatch.setenv("EMPIRE_LLM", "ollama")
    monkeypatch.setenv("OLLAMA_URL", "http://127.0.0.1:9")
    monkeypatch.setenv("EMPIRE_STATE_PATH", str(tmp_path / "s.json"))
    p = EmpirePlatform.from_env()
    st = p.llm_status()
    assert st["provider"] == "ollama" and st["model_ready"] is False
    assert p.run_agent("pools")["done"]  # falls back while Ollama is unreachable


def test_console_page_and_feed(tmp_path):
    c, _ = _client(tmp_path)
    page = c.get("/")
    assert page.status_code == 200 and "Empire Console" in page.text
    assert page.text.startswith("<!doctype html>")
    assert c.get("/api/v1/empire/console").status_code == 401
    c.post("/api/v1/empire/onboarding", headers=ADMIN, json={
        "client_name": "Acme", "contact_email": "a@b.co", "run_to_live": True})
    d = c.get("/api/v1/empire/console", headers=ADMIN).json()
    assert d["kpis"]["live"] == 1 and d["kpis"]["draft_revenue"] == 1500.0
    assert d["tenants"][0]["stage"] == "live" and d["events"][0]["seq"] > 0
    assert {"workers", "policy", "jobs", "llm", "blueprints"} <= set(d)
