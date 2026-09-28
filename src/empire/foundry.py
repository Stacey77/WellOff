"""Phase 1 — AI Foundry: blueprint catalog + scaffolding engine."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from src.empire.auth_mode import AuthMode, ProviderAuth


@dataclass
class Blueprint:
    key: str
    name: str
    description: str
    stack: list[str]
    default_model: str = "llama3.1:8b"
    files: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "name": self.name,
            "description": self.description,
            "stack": self.stack,
            "default_model": self.default_model,
            "files": self.files,
        }


DEFAULT_BLUEPRINTS: list[Blueprint] = [
    Blueprint(
        "rag-assistant",
        "Private RAG Assistant",
        "Document Q&A over customer-owned files; embeddings stay on-prem.",
        ["fastapi", "chromadb", "ollama"],
        files=["app.py", "ingest.py", "Containerfile"],
    ),
    Blueprint(
        "support-bot",
        "Support Deflection Bot",
        "Answers tier-1 tickets from the client's knowledge base.",
        ["fastapi", "ollama"],
        files=["app.py", "kb.py", "Containerfile"],
    ),
    Blueprint(
        "doc-extractor",
        "Document Extractor",
        "Pulls structured fields from invoices, contracts and forms.",
        ["fastapi", "ollama", "pydantic"],
        files=["app.py", "schemas.py", "Containerfile"],
    ),
    Blueprint(
        "agent-workflow",
        "Agent Workflow",
        "plan -> act -> check agent for a multi-step business process.",
        ["langgraph", "ollama"],
        files=["graph.py", "tools.py", "Containerfile"],
    ),
]


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "app"


@dataclass
class ScaffoldedApp:
    id: str
    name: str
    blueprint: str
    tenant_id: str | None
    auth: ProviderAuth
    model: str
    files: dict[str, str]
    created_at: str

    def to_dict(self, include_files: bool = False) -> dict[str, Any]:
        d: dict[str, Any] = {
            "id": self.id,
            "name": self.name,
            "blueprint": self.blueprint,
            "tenant_id": self.tenant_id,
            "auth": self.auth.to_dict(),
            "model": self.model,
            "file_names": sorted(self.files),
            "created_at": self.created_at,
        }
        if include_files:
            d["files"] = self.files
        return d


class AIFoundry:
    def __init__(self) -> None:
        self.blueprints = {b.key: b for b in DEFAULT_BLUEPRINTS}
        self.apps: dict[str, ScaffoldedApp] = {}

    def list_blueprints(self) -> list[dict[str, Any]]:
        return [b.to_dict() for b in self.blueprints.values()]

    def scaffold(
        self,
        name: str,
        blueprint: str,
        tenant_id: str | None = None,
        auth: ProviderAuth | None = None,
        model: str | None = None,
    ) -> ScaffoldedApp:
        if blueprint not in self.blueprints:
            raise KeyError(f"unknown blueprint {blueprint!r}")
        bp = self.blueprints[blueprint]
        auth = auth or ProviderAuth(AuthMode.LOCAL, base_url="http://ollama:11434")
        model = model or bp.default_model
        slug = _slug(name)
        files = {f: self._render(f, slug, bp, auth, model) for f in bp.files}
        app = ScaffoldedApp(
            id=f"app_{uuid.uuid4().hex[:10]}",
            name=slug,
            blueprint=blueprint,
            tenant_id=tenant_id,
            auth=auth,
            model=model,
            files=files,
            created_at=datetime.now(UTC).isoformat(),
        )
        self.apps[app.id] = app
        return app

    @staticmethod
    def _render(
        fname: str, slug: str, bp: Blueprint, auth: ProviderAuth, model: str
    ) -> str:
        if fname == "Containerfile":
            return (
                "FROM docker.io/library/python:3.11-slim\n"
                "WORKDIR /app\nCOPY . .\n"
                f"RUN pip install --no-cache-dir {' '.join(bp.stack)} uvicorn\n"
                f'LABEL nova.app="{slug}" nova.blueprint="{bp.key}"\n'
                'CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]\n'
            )
        base = auth.base_url or "http://ollama:11434"
        env = auth.env_var or ""
        return (
            f'"""{slug} — generated from blueprint {bp.key!r} by Nova AI Foundry."""\n'
            "import os\n\n"
            f'MODEL = os.environ.get("NOVA_MODEL", "{model}")\n'
            f'LLM_BASE_URL = os.environ.get("NOVA_LLM_URL", "{base}")\n'
            f'AUTH_MODE = "{auth.mode.value}"  # secret read from env: {env or "none"}\n'
        )

    def get(self, app_id: str) -> ScaffoldedApp:
        if app_id not in self.apps:
            raise KeyError(f"unknown app {app_id!r}")
        return self.apps[app_id]
