# Deploying the Three-Way Empire service

A self-hosted stack: the Empire API plus Ollama, on one machine, with state and
the audit log on a persistent volume. No cloud APIs, no outside telemetry.

```
            :8080                       internal only
  you ───▶ empire-api ──────────────▶ empire-ollama (llama3.1:8b)
           │ /data/state.json            │ ollama-models volume
           │ /data/audit.jsonl           └ empire-ollama-pull (one-shot model download)
           └ empire-data volume
```

## Windows (Podman Desktop or Docker Desktop)

```powershell
cd $HOME\agi-system
powershell -ExecutionPolicy Bypass -File deploy\empire\deploy.ps1
```

The script:
1. finds Podman or Docker and starts the Podman machine if needed,
2. creates `deploy\empire\.env` with a random operator key (first run only),
3. builds the image and starts `empire-api` and `empire-ollama`,
4. starts the model download in the background,
5. waits for `/health`, then runs `smoke_test.py` inside the container,
6. prints the URL and your operator key.

`deploy.ps1 -NoModel` skips the download. `deploy.ps1 -Down` stops everything and keeps your data.

Podman needs a compose provider. Podman Desktop installs one from
Settings → Resources → Compose. Alternatively, run `pip install podman-compose`.

## Linux / macOS

```bash
deploy/empire/deploy.sh
```

## Kubernetes (Rancher Desktop)

See the header of `k8s.yaml`. It runs one replica with persistent volumes for state and models.

## Using it

| What | How |
|---|---|
| Operator console | http://localhost:8080/ (paste the operator key once) |
| API docs | http://localhost:8080/docs |
| Health / readiness | `/health`, `/ready` (shows model status, restored state, audit chain) |
| Operator calls | header `X-API-Key: <EMPIRE_ADMIN_KEY>` |
| Client calls | header `X-Tenant-Key: <key returned at onboarding>` (only `/api/v1/empire/tenant/*`) |
| Onboard a client | `POST /api/v1/empire/onboarding` with `"run_to_live": true` |
| Re-run checks | `podman exec empire-api python /app/smoke_test.py http://127.0.0.1:8080` (with `-e EMPIRE_ADMIN_KEY=...`) |
| Back up | copy the `empire-data` volume (`state.json`, `audit.jsonl`) |

## Behaviour to know

- **State survives restarts.** Every write is saved atomically to `/data/state.json`. Scaling workers are not restored. Their CPU is released on start, and queued jobs are picked up again.
- **The model can lag behind.** Until Ollama has the model, the agent uses the built-in offline planner. `/ready` shows `model_ready` and which planner answered last.
- **Single replica.** State is one JSON file, so run one `empire-api` per client box. Use separate stacks for separate clients.
- **Smoke test leaves a record.** Each run creates one client named `Smoke Test <time>` with notes `smoke-test`.
