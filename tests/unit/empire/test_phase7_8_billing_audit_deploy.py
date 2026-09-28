import json

import pytest

from src.empire.audit import AuditLog
from src.empire.metering import Metering
from src.empire.onboarding import Proposal
from src.empire.platform import EmpirePlatform


def test_invoice_base_and_overage():
    m = Metering()
    m.open_account("t", "pilot")
    m.record("t", "agent_run", 600)
    m.record("t", "mcp_call", 10)
    inv = m.invoice("t", "2026-09")
    assert inv["lines"][0]["amount_usd"] == 1500.0
    assert inv["lines"][1] == {"description": "agent_run overage", "qty": 100,
                               "unit_usd": 0.05, "amount_usd": 5.0}
    assert inv["total_usd"] == 1505.0 and inv["status"] == "draft"
    m.change_tier("t", "retainer")
    assert m.invoice("t")["total_usd"] == 2000.0
    with pytest.raises(ValueError):
        m.record("t", "x", -1)
    with pytest.raises(KeyError):
        m.record("nobody", "x")


def test_audit_chain_detects_tampering(tmp_path):
    path = tmp_path / "audit.jsonl"
    log = AuditLog(path)
    for i in range(5):
        log.record("a", "t", {"i": i})
    assert log.verify() == (True, None)
    reloaded = AuditLog(path)
    assert reloaded.verify() == (True, None) and len(reloaded.events) == 5
    lines = path.read_text().splitlines()
    ev = json.loads(lines[2])
    ev["detail"]["i"] = 99
    lines[2] = json.dumps(ev)
    path.write_text("\n".join(lines) + "\n")
    assert AuditLog(path).verify() == (False, 2)


def test_deploy_bundle_local_tenant():
    p = EmpirePlatform()
    t = p.onboarding.accept(Proposal("Blue Oak Law", "a@b.co", tier="retainer"))
    t, _ = p.onboarding.run_to_live(t.id)
    b = p.deployer.render(t)
    assert {"podman-compose.yml", ".gitea/workflows/deploy.yml", ".env.example",
            "README.md", "Containerfile"} <= set(b)
    assert "ollama:" in b["podman-compose.yml"]
    assert "runs-on: self-hosted" in b[".gitea/workflows/deploy.yml"]
    assert "blue-oak-law" in b["podman-compose.yml"]


def test_deploy_bundle_token_tenant_has_env_placeholder_only(monkeypatch):
    monkeypatch.setenv("NOVA_ACME_TOKEN", "real-secret")
    p = EmpirePlatform()
    t = p.onboarding.accept(Proposal("Acme", "a@b.co", auth_mode="enterprise_token"))
    t, _ = p.onboarding.run_to_live(t.id)
    b = p.deployer.render(t)
    assert "${NOVA_ACME_TOKEN}" in b["podman-compose.yml"]
    assert "ollama:" not in b["podman-compose.yml"]
    assert all("real-secret" not in v for v in b.values())


def test_agent_run_is_metered_and_audited():
    p = EmpirePlatform()
    t = p.onboarding.accept(Proposal("X", "a@b.co"))
    p.onboarding.run_to_live(t.id)
    p.run_agent("blueprints then pools", t.id)
    assert p.metering.accounts[t.id].usage["agent_run"] == 1
    assert p.audit.events[-1].action == "agent.run"
