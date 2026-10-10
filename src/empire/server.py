"""Standalone Empire service — the deployable unit.

Runs only the Three-Way Empire API (no OpenAI/Anthropic keys, no ChromaDB), so a
client box needs nothing but this container and Ollama.

    uvicorn src.empire.server:app --host 0.0.0.0 --port 8080

Access control
  /health, /ready, /docs           public
  /api/v1/empire/tenant/*          client key   (X-Tenant-Key)
  every other /api/v1/empire/*     operator key (X-API-Key = EMPIRE_ADMIN_KEY)
If EMPIRE_ADMIN_KEY is unset the operator routes are open (local dev only); the
service logs a warning at startup.
"""

from __future__ import annotations

import asyncio
import hmac
import logging
import os
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from src.api.endpoints.empire import router
from src.empire.platform import EmpirePlatform

log = logging.getLogger("empire")
API_PREFIX = "/api/v1/empire"
TENANT_PREFIX = f"{API_PREFIX}/tenant/"
VERSION = "1.0.0"


def _operator_ok(request: Request, admin_key: str) -> bool:
    given = request.headers.get("x-api-key", "")
    return bool(given) and hmac.compare_digest(given, admin_key)


def create_app(platform: EmpirePlatform | None = None,
               admin_key: str | None = None) -> FastAPI:
    admin_key = admin_key if admin_key is not None else os.environ.get("EMPIRE_ADMIN_KEY", "")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        p = app.state.empire
        if not admin_key:
            log.warning("EMPIRE_ADMIN_KEY is not set: operator routes are OPEN")
        log.info("empire up: state=%s restored=%s tenants=%d llm=%s",
                 p.state_path, p.restored, len(p.onboarding.tenants),
                 p.llm_status()["provider"])
        stop = asyncio.Event()
        interval = float(os.environ.get("EMPIRE_SCALING_INTERVAL") or 0)
        task = (asyncio.create_task(p.scaling.run_loop(interval, stop))
                if interval > 0 else None)
        yield
        stop.set()
        if task is not None:
            await task
        p.persist()

    app = FastAPI(title="Nova Digitus — Three-Way Empire", version=VERSION,
                  lifespan=lifespan)
    app.state.empire = platform or EmpirePlatform.from_env()

    @app.middleware("http")
    async def operator_auth(request: Request,
                            call_next: Callable[[Request], Awaitable[Response]]
                            ) -> Response:
        path = request.url.path
        if (admin_key and path.startswith(API_PREFIX)
                and not path.startswith(TENANT_PREFIX)
                and not _operator_ok(request, admin_key)):
            return JSONResponse({"detail": "operator key required (X-API-Key)"},
                                status_code=401)
        return await call_next(request)

    @app.get("/health", tags=["ops"])
    def health() -> dict[str, Any]:
        return {"status": "ok", "version": VERSION}

    @app.get("/ready", tags=["ops"])
    def ready(request: Request) -> dict[str, Any]:
        p: EmpirePlatform = request.app.state.empire
        ok, _ = p.audit.verify()
        return {
            "status": "ready" if ok else "degraded",
            "audit_chain_ok": ok,
            "state_file": str(p.state_path) if p.state_path else None,
            "restored_from_disk": p.restored,
            "tenants": len(p.onboarding.tenants),
            "llm": p.llm_status(),
            "operator_auth": bool(admin_key),
        }

    app.include_router(router)
    return app


app = create_app()
