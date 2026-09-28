"""Phase 7 — tamper-evident, hash-chained audit log (self-hosted, no LangSmith)."""

from __future__ import annotations

import hashlib
import json
import threading
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

GENESIS = "0" * 64


@dataclass(frozen=True)
class AuditEvent:
    seq: int
    at: str
    action: str
    tenant_id: str | None
    detail: dict[str, Any]
    prev_hash: str
    hash: str

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


def _digest(seq: int, at: str, action: str, tenant: str | None,
            detail: dict[str, Any], prev: str) -> str:
    body = json.dumps([seq, at, action, tenant, detail, prev], sort_keys=True,
                      default=str)
    return hashlib.sha256(body.encode()).hexdigest()


class AuditLog:
    def __init__(self, path: str | Path | None = None) -> None:
        self.path = Path(path) if path else None
        self.events: list[AuditEvent] = []
        self._lock = threading.Lock()
        if self.path and self.path.exists():
            for line in self.path.read_text().splitlines():
                if line.strip():
                    self.events.append(AuditEvent(**json.loads(line)))

    def record(self, action: str, tenant_id: str | None = None,
               detail: dict[str, Any] | None = None) -> AuditEvent:
        with self._lock:
            detail = detail or {}
            prev = self.events[-1].hash if self.events else GENESIS
            seq = len(self.events)
            at = datetime.now(UTC).isoformat()
            ev = AuditEvent(seq, at, action, tenant_id, detail, prev,
                            _digest(seq, at, action, tenant_id, detail, prev))
            self.events.append(ev)
            if self.path:
                self.path.parent.mkdir(parents=True, exist_ok=True)
                with self.path.open("a") as fh:
                    fh.write(json.dumps(ev.to_dict(), default=str) + "\n")
            return ev

    def verify(self) -> tuple[bool, int | None]:
        """Return (ok, first_bad_seq)."""
        prev = GENESIS
        for ev in self.events:
            want = _digest(ev.seq, ev.at, ev.action, ev.tenant_id, ev.detail, prev)
            if ev.prev_hash != prev or ev.hash != want:
                return False, ev.seq
            prev = ev.hash
        return True, None

    def for_tenant(self, tenant_id: str) -> list[dict[str, Any]]:
        return [e.to_dict() for e in self.events if e.tenant_id == tenant_id]
