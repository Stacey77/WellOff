<#
  Three-Way Empire — one-command deploy for Windows (Podman Desktop or Docker Desktop).

  Run from anywhere inside your agi-system folder:
    powershell -ExecutionPolicy Bypass -File deploy\empire\deploy.ps1

  Options:
    -Model llama3.1:8b   Ollama model to pull (default from .env)
    -NoModel             Skip the model download (agent uses the offline planner)
    -Down                Stop the stack (data volumes are kept)
#>
param(
  [string]$Model = "",
  [switch]$NoModel,
  [switch]$Down
)
$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $Here "..\..")
$EnvFile = Join-Path $Here ".env"
$Compose = Join-Path $Here "compose.yml"

function Say($msg, $color = "Cyan") { Write-Host "==> $msg" -ForegroundColor $color }

# 1. Container engine
$engine = $null
foreach ($c in @("podman", "docker")) { if (Get-Command $c -ErrorAction SilentlyContinue) { $engine = $c; break } }
if (-not $engine) { throw "Install Podman Desktop (https://podman-desktop.io) or Docker Desktop first." }
if ($engine -eq "podman") {
  $running = podman machine list --format "{{.Running}}" 2>$null
  if ($running -notcontains "true") { Say "Starting Podman machine"; podman machine start | Out-Null }
}
function Compose { & $engine compose -f $Compose --env-file $EnvFile @args; if ($LASTEXITCODE) { throw "compose $args failed" } }

if ($Down) { Say "Stopping stack"; Compose down; exit 0 }

# 2. .env with a generated operator key
if (-not (Test-Path $EnvFile)) {
  Copy-Item (Join-Path $Here ".env.example") $EnvFile
  $bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $key = "op_" + ([Convert]::ToBase64String($bytes) -replace '[+/=]', '')
  (Get-Content $EnvFile) -replace '^EMPIRE_ADMIN_KEY=.*', "EMPIRE_ADMIN_KEY=$key" | Set-Content $EnvFile
  Say "Created deploy\empire\.env with a new operator key" Green
}
$envMap = @{}
Get-Content $EnvFile | Where-Object { $_ -match '^\s*([A-Z_]+)=([^#\s]*)' } | ForEach-Object { $envMap[$Matches[1]] = $Matches[2] }
if ($Model) {
  (Get-Content $EnvFile) -replace '^EMPIRE_MODEL=.*', "EMPIRE_MODEL=$Model" | Set-Content $EnvFile
  $envMap["EMPIRE_MODEL"] = $Model
}
$port = if ($envMap["EMPIRE_PORT"]) { $envMap["EMPIRE_PORT"] } else { "8080" }
$admin = $envMap["EMPIRE_ADMIN_KEY"]

# 3. Build and start
Push-Location $Root
try {
  Say "Building image and starting empire + ollama ($engine)"
  Compose up -d --build empire ollama
  if (-not $NoModel) {
    Say "Downloading model $($envMap['EMPIRE_MODEL']) in the background (first run can take several minutes)"
    Compose up -d ollama-pull
  }
} finally { Pop-Location }

# 4. Wait for health
Say "Waiting for http://localhost:$port/health"
$ok = $false
for ($i = 0; $i -lt 60; $i++) {
  try { if ((Invoke-RestMethod "http://localhost:$port/health" -TimeoutSec 3).status -eq "ok") { $ok = $true; break } } catch {}
  Start-Sleep 2
}
if (-not $ok) { & $engine logs --tail 50 empire-api; throw "Service did not become healthy." }

# 5. Smoke test inside the container (no Python needed on this PC)
Say "Running smoke test"
& $engine exec -e EMPIRE_ADMIN_KEY=$admin empire-api python /app/smoke_test.py http://127.0.0.1:8080
$smoke = $LASTEXITCODE

Write-Host ""
Say "Three-Way Empire is running" Green
Write-Host "  API docs     http://localhost:$port/docs"
Write-Host "  Readiness    http://localhost:$port/ready"
Write-Host "  Operator key $admin   (send as header X-API-Key; stored in deploy\empire\.env)"
Write-Host "  Model        docker/podman logs -f empire-ollama-pull   to watch the download"
Write-Host "  Stop         deploy\empire\deploy.ps1 -Down"
if ($smoke) { Say "Smoke test reported failures, see above" Yellow; exit 1 }
