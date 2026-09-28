"""Phase 8 — per-tenant deploy bundle: podman-compose + Gitea Actions CI.

Everything renders to plain text so it can be committed to the client's own
Gitea and run on their own hardware. No cloud registry, no third-party API.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from src.empire.auth_mode import AuthMode

if TYPE_CHECKING:
    from src.empire.foundry import AIFoundry
    from src.empire.onboarding import Tenant


class Deployer:
    def __init__(self, foundry: AIFoundry, registry: str = "localhost:5000") -> None:
        self.foundry = foundry
        self.registry = registry

    def render(self, tenant: Tenant) -> dict[str, str]:
        if not tenant.app_id:
            raise ValueError("tenant has no scaffolded app")
        app = self.foundry.get(tenant.app_id)
        slug = tenant.slug
        image = f"{self.registry}/{slug}/{app.name}:latest"
        local = tenant.auth is not None and tenant.auth.mode is AuthMode.LOCAL
        files = dict(app.files)
        files["podman-compose.yml"] = self._compose(slug, app.name, image, app.model,
                                                    tenant, local)
        files[".gitea/workflows/deploy.yml"] = self._ci(slug, image)
        files[".env.example"] = self._env(tenant)
        files["README.md"] = self._readme(tenant, app.name, local)
        return files

    @staticmethod
    def _compose(slug: str, name: str, image: str, model: str,
                 tenant: Tenant, local: bool) -> str:
        env_var = tenant.auth.env_var if tenant.auth else None
        lines = [
            f"# Nova Digitus — tenant {slug}",
            "version: \"3.8\"",
            "services:",
            f"  {name}:",
            f"    image: {image}",
            "    build: .",
            "    restart: unless-stopped",
            "    ports: [\"8080:8080\"]",
            "    environment:",
            f"      NOVA_TENANT: {tenant.id}",
            f"      NOVA_MODEL: {model}",
            "      NOVA_LLM_URL: http://ollama:11434" if local else
            "      NOVA_LLM_URL: ${NOVA_LLM_URL}",
        ]
        if env_var:
            lines.append(f"      {env_var}: ${{{env_var}}}")
        lines.append(f"    networks: [{slug}-net]")
        if local:
            lines += [
                "    depends_on: [ollama]",
                "  ollama:",
                "    image: docker.io/ollama/ollama:latest",
                "    restart: unless-stopped",
                "    volumes: [ollama-data:/root/.ollama]",
                f"    networks: [{slug}-net]",
                "volumes:",
                "  ollama-data: {}",
            ]
        lines += ["networks:", f"  {slug}-net:", "    internal: false", ""]
        return "\n".join(lines)

    @staticmethod
    def _ci(slug: str, image: str) -> str:
        return f"""name: deploy-{slug}
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - name: Build image (Podman)
        run: podman build -t {image} .
      - name: Push to private registry
        run: podman push --tls-verify=false {image}
      - name: Roll out
        run: podman-compose -f podman-compose.yml up -d
      - name: Health check
        run: curl -fsS --retry 10 --retry-delay 3 http://localhost:8080/ || exit 1
"""

    @staticmethod
    def _env(tenant: Tenant) -> str:
        out = [f"NOVA_TENANT={tenant.id}"]
        if tenant.auth and tenant.auth.env_var:
            out.append(f"{tenant.auth.env_var}=")
        if tenant.auth and tenant.auth.mode is not AuthMode.LOCAL:
            out.append("NOVA_LLM_URL=")
        return "\n".join(out) + "\n"

    @staticmethod
    def _readme(tenant: Tenant, app: str, local: bool) -> str:
        p = tenant.proposal
        return (
            f"# {p.client_name} — {app}\n\n"
            f"Tier: **{p.tier.value}** · Auth: **{p.auth_mode.value}** · "
            f"{'Fully self-hosted (Ollama on your hardware)' if local else 'Your enterprise endpoint'}\n\n"
            "## Run\n\n```bash\ncp .env.example .env   # fill in values\n"
            "podman-compose up -d\n```\n\n"
            "Pushing to `main` on your Gitea runs `.gitea/workflows/deploy.yml`.\n\n"
            "No data leaves your network.\n"
        )
