from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.endpoints.empire import router


def client() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_full_client_journey_over_rest():
    c = client()
    r = c.post("/api/v1/empire/onboarding", json={
        "client_name": "River Clinic", "contact_email": "it@river.test",
        "tier": "pilot", "run_to_live": True})
    assert r.status_code == 201, r.text
    body = r.json()
    tid, key = body["tenant"]["id"], body["tenant_api_key"]
    assert body["tenant"]["stage"] == "live" and key

    me = c.get("/api/v1/empire/tenant/me", headers={"X-Tenant-Key": key})
    assert me.status_code == 200 and me.json()["tenant"]["id"] == tid
    assert c.get("/api/v1/empire/tenant/me").status_code == 401
    assert c.get("/api/v1/empire/tenant/me",
                 headers={"X-Tenant-Key": "nk_bad"}).status_code == 401

    run = c.post("/api/v1/empire/tenant/agent/run", json={"goal": "pools"},
                 headers={"X-Tenant-Key": key})
    assert run.json()["done"] is True

    inv = c.get(f"/api/v1/empire/billing/{tid}/invoice").json()
    assert inv["usage"]["agent_run"] == 1 and inv["total_usd"] == 1500.0

    bundle = c.get(f"/api/v1/empire/onboarding/{tid}/bundle").json()
    assert "podman-compose.yml" in bundle

    audit = c.get("/api/v1/empire/audit", params={"tenant_id": tid}).json()
    assert audit["chain_ok"] and len(audit["events"]) >= 8

    snap = c.get("/api/v1/empire/snapshot").json()
    assert snap["tenants"][0]["stage"] == "live"


def test_stepwise_onboarding_and_errors():
    c = client()
    tid = c.post("/api/v1/empire/onboarding", json={
        "client_name": "A", "contact_email": "a@a.co"}).json()["tenant"]["id"]
    r = c.post(f"/api/v1/empire/onboarding/{tid}/advance")
    assert r.json()["tenant"]["stage"] == "tenant_created"
    assert c.post("/api/v1/empire/onboarding/nope/advance").status_code == 404
    assert c.post("/api/v1/empire/onboarding", json={
        "client_name": "A", "contact_email": "bad"}).status_code == 422
    assert c.get(f"/api/v1/empire/onboarding/{tid}/bundle").status_code == 409


def test_pillar_endpoints():
    c = client()
    assert len(c.get("/api/v1/empire/foundry/blueprints").json()) == 4
    app = c.post("/api/v1/empire/foundry/apps",
                 json={"name": "demo", "blueprint": "doc-extractor"})
    assert app.status_code == 201 and "files" in app.json()
    assert c.post("/api/v1/empire/foundry/apps",
                  json={"name": "d", "blueprint": "zzz"}).status_code == 404
    assert c.post("/api/v1/empire/foundry/apps", json={
        "name": "d", "blueprint": "doc-extractor",
        "auth_mode": "api_key"}).status_code == 422
    dep = c.post("/api/v1/empire/factory/deployments",
                 json={"app_id": app.json()["id"], "cpus": 1})
    assert dep.status_code == 201
    assert c.post("/api/v1/empire/factory/deployments",
                  json={"app_id": app.json()["id"], "cpus": 200}).status_code == 409
    assert c.delete(f"/api/v1/empire/factory/deployments/{dep.json()['id']}"
                    ).json()["status"] == "stopped"
    ses = c.post("/api/v1/empire/studio/sessions", json={"repo": "nova/x"})
    assert ses.status_code == 201
    assert len(c.get("/api/v1/empire/mcp/tools").json()) == 9
