"""Phase 3 — MCP server exposing the three pillars (+ onboarding) as tools.

Run standalone:  python -m src.empire.mcp_server   (stdio transport)
Tools are plain functions in ``TOOLS`` so they are testable without MCP.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from src.empire.auth_mode import AuthMode, ProviderAuth
from src.empire.platform import EmpirePlatform

TOOL_NAMES = (
    "foundry_list_blueprints",
    "foundry_scaffold_app",
    "factory_list_pools",
    "factory_deploy",
    "factory_teardown",
    "studio_list_assistants",
    "studio_open_session",
    "platform_snapshot",
    "agent_run",
)


def build_tools(p: EmpirePlatform) -> dict[str, Callable[..., Any]]:
    def foundry_list_blueprints() -> list[dict[str, Any]]:
        """List AI Foundry app blueprints."""
        return p.foundry.list_blueprints()

    def foundry_scaffold_app(name: str, blueprint: str, auth_mode: str = "local",
                             env_var: str | None = None,
                             tenant_id: str | None = None) -> dict[str, Any]:
        """Scaffold a new app from a blueprint with per-client auth."""
        auth = ProviderAuth(AuthMode(auth_mode), env_var)
        return p.foundry.scaffold(name, blueprint, tenant_id, auth).to_dict()

    def factory_list_pools() -> list[dict[str, Any]]:
        """List AI Factory compute pools and free capacity."""
        return [x.to_dict() for x in p.factory.pools.values()]

    def factory_deploy(app_id: str, environment: str = "dev",
                       pool: str = "local-cpu", cpus: int = 1) -> dict[str, Any]:
        """Deploy an app to dev/staging (Podman) or prod (Rancher)."""
        return p.factory.deploy(app_id, environment, pool, cpus).to_dict()

    def factory_teardown(deployment_id: str) -> dict[str, Any]:
        """Stop a deployment and release its capacity."""
        return p.factory.teardown(deployment_id).to_dict()

    def studio_list_assistants() -> list[dict[str, Any]]:
        """List self-hosted Agentic Studio coding assistants."""
        return p.studio.list_assistants()

    def studio_open_session(repo: str, assistant: str = "nova-coder",
                            kind: str = "cde") -> dict[str, Any]:
        """Open a Gitea-backed IDE/CDE coding session."""
        return p.studio.open_session(repo, assistant, kind).to_dict()

    def platform_snapshot() -> dict[str, Any]:
        """Full platform snapshot (loadable by nova-cockpit.html)."""
        return p.snapshot()

    def agent_run(goal: str, tenant_id: str | None = None) -> dict[str, Any]:
        """Run the plan->act->check agent on a goal."""
        return p.run_agent(goal, tenant_id)

    tools = {f.__name__: f for f in (
        foundry_list_blueprints, foundry_scaffold_app, factory_list_pools,
        factory_deploy, factory_teardown, studio_list_assistants,
        studio_open_session, platform_snapshot, agent_run)}
    assert tuple(tools) == TOOL_NAMES
    return tools


def build_server(p: EmpirePlatform | None = None,
                 allowed: list[str] | None = None) -> Any:
    """Build a FastMCP server. ``allowed`` restricts tools (per-tenant)."""
    from mcp.server.fastmcp import FastMCP

    p = p or EmpirePlatform()
    server = FastMCP("nova-empire")
    for name, fn in build_tools(p).items():
        if allowed is None or name in allowed:
            server.tool(name=name)(fn)
    return server


if __name__ == "__main__":  # pragma: no cover
    build_server().run()
