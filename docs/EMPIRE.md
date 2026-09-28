# Three-Way Empire — `src/empire`

Nova Digitus Designs' private AI platform. Every workload runs on
customer-owned infrastructure; no LangSmith, no third-party telemetry.

| Phase | Module | What it does |
|---|---|---|
| 1 | `foundry.py`, `factory.py`, `studio.py` | Blueprint catalog + scaffolding; compute pools + env→backend deploys (dev/staging=Podman, prod=Rancher); Gitea-aware IDE/CDE sessions |
| 2 | `auth_mode.py`, `infra.py` | Per-client `api_key` / `enterprise_token` / `local`; secrets resolved from env at call time, never serialized |
| 3 | `mcp_server.py` | FastMCP server, 9 tools, per-tenant allowlist. `python -m src.empire.mcp_server` |
| 4 | `graph.py` | plan → act → check agent. LangGraph `StateGraph` if installed, identical built-in engine otherwise. `OllamaLLM` for self-hosted models |
| 5 | `onboarding.py` | proposal_accepted → tenant_created → auth_bootstrapped → mcp_enabled → pilot_scaffolded → pilot_deployed → live. Resumable; tenant key shown once, stored hashed |
| 6 | `src/api/endpoints/empire.py` | `/api/v1/empire/*` (18 routes) incl. tenant self-service via `X-Tenant-Key` |
| 7 | `metering.py`, `audit.py` | Strategy $300 / Pilot $1,500 / Retainer $2,000/mo with included usage + overage; invoice drafts; SHA-256 hash-chained audit log (`EMPIRE_AUDIT_PATH`) |
| 8 | `deploy.py` | Per-tenant bundle: app files, `podman-compose.yml` (bundled Ollama for local tenants), `.gitea/workflows/deploy.yml`, `.env.example`, README |

## One-call onboarding

```bash
curl -X POST localhost:8000/api/v1/empire/onboarding -H 'content-type: application/json' \
  -d '{"client_name":"River Clinic","contact_email":"it@river.test","tier":"pilot","run_to_live":true}'
```

Returns the live tenant and its one-time `tenant_api_key`. Then
`GET /api/v1/empire/onboarding/{id}/bundle` gives the deploy files to commit to
the client's Gitea.

Tests: `pytest tests/unit/empire` (27).
