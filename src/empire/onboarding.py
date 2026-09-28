"""Phase 5 — client onboarding: proposal -> live, as an auditable state machine.

Stages (in order):
  proposal_accepted -> tenant_created -> auth_bootstrapped -> mcp_enabled
  -> pilot_scaffolded -> pilot_deployed -> live
Each ``advance`` runs exactly one stage; ``run_to_live`` runs them all. A stage
that fails leaves the tenant on the previous stage with the error recorded, so
onboarding is resumable.
"""

from __future__ import annotations

import re
import secrets
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import TYPE_CHECKING, Any

from src.empire.auth_mode import AuthMode, ProviderAuth

if TYPE_CHECKING:
    from src.empire.platform import EmpirePlatform


class Stage(str, Enum):
    PROPOSAL_ACCEPTED = "proposal_accepted"
    TENANT_CREATED = "tenant_created"
    AUTH_BOOTSTRAPPED = "auth_bootstrapped"
    MCP_ENABLED = "mcp_enabled"
    PILOT_SCAFFOLDED = "pilot_scaffolded"
    PILOT_DEPLOYED = "pilot_deployed"
    LIVE = "live"


ORDER = list(Stage)


class Tier(str, Enum):
    STRATEGY = "strategy"
    PILOT = "pilot"
    RETAINER = "retainer"


@dataclass
class Proposal:
    client_name: str
    contact_email: str
    tier: Tier = Tier.PILOT
    auth_mode: AuthMode = AuthMode.LOCAL
    blueprint: str = "rag-assistant"
    price_usd: float = 1500.0
    mcp_tools: list[str] | None = None  # None = all tools
    notes: str = ""

    def __post_init__(self) -> None:
        self.tier = Tier(self.tier)
        self.auth_mode = AuthMode(self.auth_mode)
        if "@" not in self.contact_email:
            raise ValueError("contact_email must be an email address")
        if not self.client_name.strip():
            raise ValueError("client_name required")


@dataclass
class Tenant:
    id: str
    slug: str
    proposal: Proposal
    stage: Stage = Stage.PROPOSAL_ACCEPTED
    auth: ProviderAuth | None = None
    api_key_hint: str | None = None
    mcp_tools: list[str] = field(default_factory=list)
    app_id: str | None = None
    deployment_id: str | None = None
    history: list[dict[str, Any]] = field(default_factory=list)
    last_error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        p = self.proposal
        return {
            "id": self.id,
            "slug": self.slug,
            "client_name": p.client_name,
            "contact_email": p.contact_email,
            "tier": p.tier.value,
            "price_usd": p.price_usd,
            "stage": self.stage.value,
            "progress": round(ORDER.index(self.stage) / (len(ORDER) - 1), 2),
            "auth": self.auth.to_dict() if self.auth else None,
            "api_key_hint": self.api_key_hint,
            "mcp_tools": self.mcp_tools,
            "app_id": self.app_id,
            "deployment_id": self.deployment_id,
            "last_error": self.last_error,
            "history": self.history,
        }


class OnboardingError(RuntimeError):
    pass


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:40] or "client"


class OnboardingFlow:
    def __init__(self, platform: EmpirePlatform) -> None:
        self.p = platform
        self.tenants: dict[str, Tenant] = {}

    # -- public ---------------------------------------------------------
    def accept(self, proposal: Proposal) -> Tenant:
        slug = _slug(proposal.client_name)
        if any(t.slug == slug for t in self.tenants.values()):
            slug = f"{slug}-{uuid.uuid4().hex[:4]}"
        t = Tenant(id=f"ten_{uuid.uuid4().hex[:10]}", slug=slug, proposal=proposal)
        self._log(t, Stage.PROPOSAL_ACCEPTED, {"tier": proposal.tier.value})
        return t

    def get(self, tenant_id: str) -> Tenant:
        if tenant_id not in self.tenants:
            raise KeyError(f"unknown tenant {tenant_id!r}")
        return self.tenants[tenant_id]

    def advance(self, tenant_id: str) -> tuple[Tenant, str | None]:
        """Run the next stage. Returns (tenant, plaintext_api_key_or_None).

        The tenant API key is returned exactly once (auth bootstrap) and never
        stored in plaintext.
        """
        t = self.get(tenant_id)
        if t.stage is Stage.LIVE:
            return t, None
        nxt = ORDER[ORDER.index(t.stage) + 1]
        handler = getattr(self, f"_do_{nxt.value}")
        try:
            secret, detail = handler(t)
        except Exception as exc:
            t.last_error = f"{nxt.value}: {exc}"
            self.p.audit.record("onboarding.failed", t.id, {"stage": nxt.value,
                                                            "error": str(exc)})
            raise OnboardingError(t.last_error) from exc
        t.last_error = None
        t.stage = nxt
        self._log(t, nxt, detail)
        return t, secret

    def run_to_live(self, tenant_id: str) -> tuple[Tenant, str | None]:
        key: str | None = None
        t = self.get(tenant_id)
        while t.stage is not Stage.LIVE:
            t, k = self.advance(tenant_id)
            key = key or k
        return t, key

    # -- stages ---------------------------------------------------------
    def _do_tenant_created(self, t: Tenant) -> tuple[None, dict[str, Any]]:
        self.p.metering.open_account(t.id, t.proposal.tier)
        return None, {"slug": t.slug}

    def _do_auth_bootstrapped(self, t: Tenant) -> tuple[str, dict[str, Any]]:
        mode = t.proposal.auth_mode
        env = None if mode is AuthMode.LOCAL else f"NOVA_{t.slug.upper().replace('-', '_')}_TOKEN"
        base = f"http://ollama.{t.slug}.svc:11434" if mode is AuthMode.LOCAL else None
        t.auth = ProviderAuth(mode, env, base)
        key = f"nk_{t.slug}_{secrets.token_urlsafe(24)}"
        self.p.register_tenant_key(t.id, key)
        t.api_key_hint = key[:10] + "…" + key[-4:]
        return key, {"auth_mode": mode.value, "api_less": t.auth.api_less}

    def _do_mcp_enabled(self, t: Tenant) -> tuple[None, dict[str, Any]]:
        from src.empire.mcp_server import TOOL_NAMES

        wanted = t.proposal.mcp_tools or list(TOOL_NAMES)
        unknown = sorted(set(wanted) - set(TOOL_NAMES))
        if unknown:
            raise ValueError(f"unknown MCP tools: {unknown}")
        t.mcp_tools = list(wanted)
        return None, {"tools": len(t.mcp_tools)}

    def _do_pilot_scaffolded(self, t: Tenant) -> tuple[None, dict[str, Any]]:
        assert t.auth is not None
        app = self.p.foundry.scaffold(
            f"{t.slug}-{t.proposal.blueprint}", t.proposal.blueprint, t.id, t.auth
        )
        t.app_id = app.id
        return None, {"app_id": app.id, "blueprint": app.blueprint}

    def _do_pilot_deployed(self, t: Tenant) -> tuple[None, dict[str, Any]]:
        assert t.app_id
        dep = self.p.factory.deploy(t.app_id, "staging", tenant_id=t.id)
        t.deployment_id = dep.id
        self.p.metering.record(t.id, "deployment", 1)
        return None, {"deployment_id": dep.id, "backend": dep.backend}

    def _do_live(self, t: Tenant) -> tuple[None, dict[str, Any]]:
        bundle = self.p.deployer.render(t)
        return None, {"bundle_files": sorted(bundle)}

    def _log(self, t: Tenant, stage: Stage, detail: dict[str, Any]) -> None:
        self.tenants[t.id] = t
        t.history.append(
            {"stage": stage.value, "at": datetime.now(UTC).isoformat(), **detail}
        )
        self.p.audit.record(f"onboarding.{stage.value}", t.id, detail)
