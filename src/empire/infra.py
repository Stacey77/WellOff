"""Phase 2 — open-source infrastructure backends (Podman, Rancher, Gitea)."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from src.empire.auth_mode import AuthMode, ProviderAuth


class BackendKind(str, Enum):
    PODMAN = "podman"
    RANCHER = "rancher"
    GITEA = "gitea"
    OLLAMA = "ollama"


@dataclass
class InfraBackend:
    name: str
    kind: BackendKind
    auth: ProviderAuth
    endpoint: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "kind": self.kind.value,
            "endpoint": self.endpoint,
            "auth": self.auth.to_dict(),
        }


def default_backends(
    gitea_url: str = "http://localhost:3000",
    rancher_url: str = "https://localhost:9443",
    ollama_url: str = "http://localhost:11434",
) -> dict[str, InfraBackend]:
    return {
        "podman": InfraBackend(
            "podman",
            BackendKind.PODMAN,
            ProviderAuth(AuthMode.LOCAL),
            "unix:///run/podman/podman.sock",
        ),
        "rancher": InfraBackend(
            "rancher",
            BackendKind.RANCHER,
            ProviderAuth(AuthMode.ENTERPRISE_TOKEN, "RANCHER_TOKEN", rancher_url),
            rancher_url,
        ),
        "gitea": InfraBackend(
            "gitea",
            BackendKind.GITEA,
            ProviderAuth(AuthMode.ENTERPRISE_TOKEN, "GITEA_TOKEN", gitea_url),
            gitea_url,
        ),
        "ollama": InfraBackend(
            "ollama",
            BackendKind.OLLAMA,
            ProviderAuth(AuthMode.LOCAL, base_url=ollama_url),
            ollama_url,
        ),
    }


@dataclass
class InfraRegistry:
    backends: dict[str, InfraBackend] = field(default_factory=default_backends)

    def get(self, name: str) -> InfraBackend:
        if name not in self.backends:
            raise KeyError(f"unknown backend {name!r}")
        return self.backends[name]

    def to_list(self) -> list[dict[str, Any]]:
        return [b.to_dict() for b in self.backends.values()]
