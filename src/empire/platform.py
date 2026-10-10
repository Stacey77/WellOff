"""EmpirePlatform — single facade wiring all phases together."""

from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Any

from src.empire.audit import AuditLog
from src.empire.deploy import Deployer
from src.empire.factory import AIFactory
from src.empire.foundry import AIFoundry
from src.empire.graph import LLM, FallbackLLM, OllamaLLM, PlanActCheckAgent
from src.empire.infra import InfraRegistry
from src.empire.metering import Metering
from src.empire.onboarding import OnboardingFlow
from src.empire.scaling import ScalingEngine
from src.empire.studio import AgenticStudio


class EmpirePlatform:
    def __init__(self, audit_path: str | Path | None = None,
                 llm: LLM | None = None,
                 state_path: str | Path | None = None) -> None:
        self.infra = InfraRegistry()
        self.foundry = AIFoundry()
        self.factory = AIFactory(self.infra)
        self.studio = AgenticStudio()
        self.audit = AuditLog(audit_path)
        self.metering = Metering()
        self.deployer = Deployer(self.foundry)
        self.onboarding = OnboardingFlow(self)
        self.llm = llm
        self.scaling = ScalingEngine(self)
        self._tenant_keys: dict[str, str] = {}  # sha256(key) -> tenant_id
        self.state_path = Path(state_path) if state_path else None
        self.restored = False
        if self.state_path:
            from src.empire import state

            self.restored = state.load(self, self.state_path)

    @classmethod
    def from_env(cls) -> EmpirePlatform:
        """Build the platform from deployment environment variables.

        EMPIRE_STATE_PATH   JSON state file (survives restarts)
        EMPIRE_AUDIT_PATH   audit log file
        EMPIRE_LLM          "ollama" or "rule" (default rule = offline planner)
        OLLAMA_URL          default http://localhost:11434
        EMPIRE_MODEL        default llama3.1:8b
        """
        llm: LLM | None = None
        if os.environ.get("EMPIRE_LLM", "rule").lower() == "ollama":
            llm = FallbackLLM(OllamaLLM(
                os.environ.get("EMPIRE_MODEL", "llama3.1:8b"),
                os.environ.get("OLLAMA_URL", "http://localhost:11434")))
        return cls(audit_path=os.environ.get("EMPIRE_AUDIT_PATH") or None, llm=llm,
                   state_path=os.environ.get("EMPIRE_STATE_PATH") or None)

    def persist(self) -> None:
        if self.state_path:
            from src.empire import state

            state.save(self, self.state_path)

    def llm_status(self) -> dict[str, Any]:
        if isinstance(self.llm, FallbackLLM) and isinstance(self.llm.primary, OllamaLLM):
            o = self.llm.primary
            return {"provider": "ollama", "model": o.model, "url": o.base_url,
                    "model_ready": o.available(), "last_source": self.llm.last_source}
        return {"provider": "rule", "model": None, "model_ready": True}

    # tenant API keys are stored hashed only
    def register_tenant_key(self, tenant_id: str, key: str) -> None:
        self._tenant_keys[hashlib.sha256(key.encode()).hexdigest()] = tenant_id

    def tenant_for_key(self, key: str) -> str | None:
        return self._tenant_keys.get(hashlib.sha256(key.encode()).hexdigest())

    def run_agent(self, goal: str, tenant_id: str | None = None) -> dict[str, Any]:
        agent = PlanActCheckAgent(self.llm, tools=self._agent_tools())
        state = agent.run(goal)
        if tenant_id:
            self.metering.record(tenant_id, "agent_run", 1)
        self.audit.record("agent.run", tenant_id,
                          {"goal": goal, "done": state.get("done"),
                           "engine": agent.engine})
        return {"engine": agent.engine, **state}

    def _agent_tools(self) -> dict[str, Any]:
        return {
            "blueprints": lambda _a: [b["key"] for b in self.foundry.list_blueprints()],
            "backends": lambda _a: [b["name"] for b in self.infra.to_list()],
            "pools": lambda _a: [p.to_dict() for p in self.factory.pools.values()],
        }

    def snapshot(self) -> dict[str, Any]:
        ok, bad = self.audit.verify()
        return {
            "pillars": {
                "foundry": {"blueprints": len(self.foundry.blueprints),
                            "apps": len(self.foundry.apps)},
                "factory": {"pools": [p.to_dict() for p in self.factory.pools.values()],
                            "deployments": len(self.factory.deployments)},
                "studio": {"assistants": len(self.studio.assistants),
                           "sessions": len(self.studio.sessions)},
            },
            "infra": self.infra.to_list(),
            "tenants": [t.to_dict() for t in self.onboarding.tenants.values()],
            "audit": {"events": len(self.audit.events), "chain_ok": ok,
                      "first_bad_seq": bad},
            "scaling": {"workers": len(self.scaling.active_workers()),
                        "queued": self.scaling.queued(),
                        "desired_workers": self.scaling.desired_workers()},
        }
