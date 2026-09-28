"""Phase 1 — Agentic Studio: coding assistants + IDE/CDE sessions (Gitea-aware)."""

from __future__ import annotations

import os
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class Assistant:
    key: str
    name: str
    model: str
    self_hosted: bool


DEFAULT_ASSISTANTS = [
    Assistant("nova-coder", "Nova Coder", "qwen2.5-coder:14b", True),
    Assistant("nova-reviewer", "Nova Reviewer", "llama3.1:8b", True),
    Assistant("continue-dev", "Continue.dev bridge", "qwen2.5-coder:7b", True),
]


@dataclass
class StudioSession:
    id: str
    tenant_id: str | None
    assistant: str
    kind: str  # "ide" | "cde"
    repo: str
    repo_url: str
    status: str = "active"
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


class AgenticStudio:
    def __init__(self, gitea_base_url: str | None = None) -> None:
        self.gitea_base_url = (
            gitea_base_url or os.environ.get("GITEA_BASE_URL", "http://localhost:3000")
        ).rstrip("/")
        self.assistants = {a.key: a for a in DEFAULT_ASSISTANTS}
        self.sessions: dict[str, StudioSession] = {}

    def list_assistants(self) -> list[dict[str, Any]]:
        return [a.__dict__.copy() for a in self.assistants.values()]

    def open_session(
        self,
        repo: str,
        assistant: str = "nova-coder",
        kind: str = "cde",
        tenant_id: str | None = None,
    ) -> StudioSession:
        if assistant not in self.assistants:
            raise KeyError(f"unknown assistant {assistant!r}")
        if kind not in ("ide", "cde"):
            raise ValueError("kind must be 'ide' or 'cde'")
        s = StudioSession(
            id=f"ses_{uuid.uuid4().hex[:10]}",
            tenant_id=tenant_id,
            assistant=assistant,
            kind=kind,
            repo=repo,
            repo_url=f"{self.gitea_base_url}/{repo.strip('/')}.git",
        )
        self.sessions[s.id] = s
        return s

    def close_session(self, session_id: str) -> StudioSession:
        s = self.sessions[session_id]
        s.status = "closed"
        return s
