"""Phase 6 — Three-Way Empire REST API (/api/v1/empire).

Operator endpoints sit behind the app's existing API-key/JWT middleware.
Tenant self-service endpoints additionally require ``X-Tenant-Key`` (issued once
during onboarding auth bootstrap; stored hashed).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

from src.empire.auth_mode import AuthError, AuthMode, ProviderAuth
from src.empire.factory import CapacityError
from src.empire.mcp_server import TOOL_NAMES
from src.empire.onboarding import OnboardingError, Proposal, Tier
from src.empire.platform import EmpirePlatform

router = APIRouter(prefix="/api/v1/empire", tags=["empire"])


def _p(request: Request) -> EmpirePlatform:
    p = getattr(request.app.state, "empire", None)
    if p is None:
        p = request.app.state.empire = EmpirePlatform()
    return p


def _404(exc: KeyError) -> HTTPException:
    return HTTPException(status_code=404, detail=str(exc.args[0] if exc.args else exc))


# ---------------- snapshot ----------------
@router.get("/snapshot")
def snapshot(request: Request) -> dict[str, Any]:
    return _p(request).snapshot()


# ---------------- Foundry ----------------
class ScaffoldRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    blueprint: str
    auth_mode: AuthMode = AuthMode.LOCAL
    env_var: str | None = None
    tenant_id: str | None = None
    model: str | None = None


@router.get("/foundry/blueprints")
def blueprints(request: Request) -> list[dict[str, Any]]:
    return _p(request).foundry.list_blueprints()


@router.post("/foundry/apps", status_code=201)
def scaffold(body: ScaffoldRequest, request: Request) -> dict[str, Any]:
    try:
        auth = ProviderAuth(body.auth_mode, body.env_var)
        app = _p(request).foundry.scaffold(body.name, body.blueprint, body.tenant_id,
                                           auth, body.model)
    except AuthError as exc:
        raise HTTPException(422, str(exc)) from exc
    except KeyError as exc:
        raise _404(exc) from exc
    return app.to_dict(include_files=True)


# ---------------- Factory ----------------
class DeployRequest(BaseModel):
    app_id: str
    environment: str = "dev"
    pool: str = "local-cpu"
    cpus: int = Field(1, ge=1, le=256)


@router.get("/factory/pools")
def pools(request: Request) -> list[dict[str, Any]]:
    return [x.to_dict() for x in _p(request).factory.pools.values()]


@router.post("/factory/deployments", status_code=201)
def deploy(body: DeployRequest, request: Request) -> dict[str, Any]:
    p = _p(request)
    try:
        app = p.foundry.get(body.app_id)
        return p.factory.deploy(body.app_id, body.environment, body.pool, body.cpus,
                                app.tenant_id).to_dict()
    except KeyError as exc:
        raise _404(exc) from exc
    except CapacityError as exc:
        raise HTTPException(409, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.delete("/factory/deployments/{deployment_id}")
def teardown(deployment_id: str, request: Request) -> dict[str, Any]:
    try:
        return _p(request).factory.teardown(deployment_id).to_dict()
    except KeyError as exc:
        raise _404(exc) from exc


# ---------------- Studio ----------------
class SessionRequest(BaseModel):
    repo: str
    assistant: str = "nova-coder"
    kind: str = "cde"
    tenant_id: str | None = None


@router.post("/studio/sessions", status_code=201)
def open_session(body: SessionRequest, request: Request) -> dict[str, Any]:
    try:
        return _p(request).studio.open_session(body.repo, body.assistant, body.kind,
                                               body.tenant_id).to_dict()
    except KeyError as exc:
        raise _404(exc) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


# ---------------- Agent ----------------
class AgentRequest(BaseModel):
    goal: str = Field(min_length=1, max_length=2000)
    tenant_id: str | None = None


@router.post("/agent/run")
def agent_run(body: AgentRequest, request: Request) -> dict[str, Any]:
    return _p(request).run_agent(body.goal, body.tenant_id)


# ---------------- Onboarding ----------------
class ProposalRequest(BaseModel):
    client_name: str = Field(min_length=1, max_length=120)
    contact_email: str
    tier: Tier = Tier.PILOT
    auth_mode: AuthMode = AuthMode.LOCAL
    blueprint: str = "rag-assistant"
    price_usd: float = Field(1500.0, ge=0)
    mcp_tools: list[str] | None = None
    notes: str = ""
    run_to_live: bool = False


@router.post("/onboarding", status_code=201)
def onboard(body: ProposalRequest, request: Request) -> dict[str, Any]:
    p = _p(request)
    data = body.model_dump(exclude={"run_to_live"})
    try:
        t = p.onboarding.accept(Proposal(**data))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    key = None
    if body.run_to_live:
        try:
            t, key = p.onboarding.run_to_live(t.id)
        except OnboardingError as exc:
            raise HTTPException(409, {"tenant": t.to_dict(), "error": str(exc)}) from exc
    return {"tenant": t.to_dict(), "tenant_api_key": key}


@router.get("/onboarding")
def list_tenants(request: Request) -> list[dict[str, Any]]:
    return [t.to_dict() for t in _p(request).onboarding.tenants.values()]


@router.get("/onboarding/{tenant_id}")
def get_tenant(tenant_id: str, request: Request) -> dict[str, Any]:
    try:
        return _p(request).onboarding.get(tenant_id).to_dict()
    except KeyError as exc:
        raise _404(exc) from exc


@router.post("/onboarding/{tenant_id}/advance")
def advance(tenant_id: str, request: Request) -> dict[str, Any]:
    p = _p(request)
    try:
        t, key = p.onboarding.advance(tenant_id)
    except KeyError as exc:
        raise _404(exc) from exc
    except OnboardingError as exc:
        raise HTTPException(409, str(exc)) from exc
    return {"tenant": t.to_dict(), "tenant_api_key": key}


@router.get("/onboarding/{tenant_id}/bundle")
def bundle(tenant_id: str, request: Request) -> dict[str, str]:
    p = _p(request)
    try:
        t = p.onboarding.get(tenant_id)
        return p.deployer.render(t)
    except KeyError as exc:
        raise _404(exc) from exc
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc


# ---------------- Billing / audit ----------------
class UsageRequest(BaseModel):
    metric: str = Field(pattern=r"^[a-z_]{2,40}$")
    qty: int = Field(1, ge=0)


@router.post("/billing/{tenant_id}/usage", status_code=202)
def record_usage(tenant_id: str, body: UsageRequest, request: Request) -> dict[str, Any]:
    try:
        _p(request).metering.record(tenant_id, body.metric, body.qty)
    except KeyError as exc:
        raise _404(exc) from exc
    return {"ok": True}


@router.get("/billing/{tenant_id}/invoice")
def invoice(tenant_id: str, request: Request) -> dict[str, Any]:
    try:
        return _p(request).metering.invoice(tenant_id)
    except KeyError as exc:
        raise _404(exc) from exc


@router.get("/audit")
def audit(request: Request, tenant_id: str | None = None) -> dict[str, Any]:
    log = _p(request).audit
    ok, bad = log.verify()
    events = log.for_tenant(tenant_id) if tenant_id else [e.to_dict() for e in log.events]
    return {"chain_ok": ok, "first_bad_seq": bad, "events": events}


@router.get("/mcp/tools")
def mcp_tools() -> list[str]:
    return list(TOOL_NAMES)


# ---------------- Tenant self-service ----------------
def _tenant(request: Request, key: str | None) -> str:
    tid = _p(request).tenant_for_key(key or "")
    if not tid:
        raise HTTPException(401, "invalid or missing X-Tenant-Key")
    return tid


@router.get("/tenant/me")
def tenant_me(request: Request,
              x_tenant_key: str | None = Header(default=None)) -> dict[str, Any]:
    p = _p(request)
    tid = _tenant(request, x_tenant_key)
    return {"tenant": p.onboarding.get(tid).to_dict(),
            "invoice": p.metering.invoice(tid)}


@router.post("/tenant/agent/run")
def tenant_agent(body: AgentRequest, request: Request,
                 x_tenant_key: str | None = Header(default=None)) -> dict[str, Any]:
    tid = _tenant(request, x_tenant_key)
    return _p(request).run_agent(body.goal, tid)
