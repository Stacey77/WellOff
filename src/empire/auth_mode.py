"""Phase 2 — per-client auth modes.

Secrets are never stored: only the *name* of the env var is kept and resolved at
call time. ``to_dict`` never includes the secret value.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from enum import Enum
from typing import Any


class AuthMode(str, Enum):
    API_KEY = "api_key"  # hosted cloud API
    ENTERPRISE_TOKEN = "enterprise_token"  # self-hosted enterprise, token auth
    LOCAL = "local"  # API-less, customer-owned endpoint


class AuthError(RuntimeError):
    pass


@dataclass
class ProviderAuth:
    mode: AuthMode = AuthMode.LOCAL
    env_var: str | None = None
    base_url: str | None = None

    def __post_init__(self) -> None:
        self.mode = AuthMode(self.mode)
        if self.mode is not AuthMode.LOCAL and not self.env_var:
            raise AuthError(f"{self.mode.value} auth requires env_var")

    @property
    def api_less(self) -> bool:
        """True when no third-party public API is touched."""
        return self.mode in (AuthMode.LOCAL, AuthMode.ENTERPRISE_TOKEN)

    def resolve(self) -> str | None:
        if self.mode is AuthMode.LOCAL:
            return None
        value = os.environ.get(self.env_var or "")
        if not value:
            raise AuthError(f"env var {self.env_var} is not set")
        return value

    @property
    def ready(self) -> bool:
        try:
            self.resolve()
            return True
        except AuthError:
            return False

    def headers(self) -> dict[str, str]:
        secret = self.resolve()
        if secret is None:
            return {}
        if self.mode is AuthMode.API_KEY:
            return {"Authorization": f"Bearer {secret}"}
        return {"Authorization": f"token {secret}"}

    def to_dict(self) -> dict[str, Any]:
        return {
            "mode": self.mode.value,
            "env_var": self.env_var,
            "base_url": self.base_url,
            "api_less": self.api_less,
            "ready": self.ready,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ProviderAuth:
        return cls(
            mode=AuthMode(data.get("mode", "local")),
            env_var=data.get("env_var"),
            base_url=data.get("base_url"),
        )
