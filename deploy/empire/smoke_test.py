"""End-to-end smoke test for a running Empire service. Standard library only.

    python smoke_test.py http://localhost:8080          (key from EMPIRE_ADMIN_KEY)
    python smoke_test.py http://localhost:8080 <admin-key>

Walks one client through the real lifecycle: onboard to live, client login,
queue a job, let the autoscaler run it, invoice, audit chain, deploy bundle.
Creates one client named "Smoke Test <time>" tagged notes="smoke-test".
Exit code 0 = every check passed.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080").rstrip("/")
ADMIN = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("EMPIRE_ADMIN_KEY", "")
API = f"{BASE}/api/v1/empire"
failures = 0


def call(method: str, url: str, body: dict[str, Any] | None = None,
         headers: dict[str, str] | None = None) -> tuple[int, Any]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("content-type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null")


def check(name: str, ok: bool, detail: Any = "") -> None:
    global failures
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  ({detail})" if detail else ""))
    failures += 0 if ok else 1


def main() -> int:
    op = {"X-API-Key": ADMIN} if ADMIN else {}
    print(f"Smoke test against {BASE}")

    s, h = call("GET", f"{BASE}/health")
    check("service is up", s == 200, h)
    s, rd = call("GET", f"{BASE}/ready")
    check("ready", s == 200 and rd.get("status") == "ready",
          f"llm={rd.get('llm', {}).get('provider')} "
          f"model_ready={rd.get('llm', {}).get('model_ready')}")

    s, _ = call("GET", f"{API}/snapshot")
    check("operator routes reject requests without the key",
          s == 401 or not rd.get("operator_auth"), f"HTTP {s}")

    name = f"Smoke Test {time.strftime('%Y%m%d-%H%M%S')}"
    s, ob = call("POST", f"{API}/onboarding", {
        "client_name": name, "contact_email": "smoke@nova.test", "tier": "pilot",
        "notes": "smoke-test", "run_to_live": True}, op)
    ok = s == 201 and ob["tenant"]["stage"] == "live"
    check("onboard a client to live", ok, f"HTTP {s}")
    if not ok:
        print(ob)
        return 1
    tid, key = ob["tenant"]["id"], ob["tenant_api_key"]
    tk = {"X-Tenant-Key": key}

    s, me = call("GET", f"{API}/tenant/me", headers=tk)
    check("client logs in with its own key", s == 200 and me["tenant"]["id"] == tid)

    s, job = call("POST", f"{API}/tenant/jobs",
                  {"goal": "blueprints then pools", "priority": 7}, tk)
    check("client queues a job", s == 202, job.get("id") if isinstance(job, dict) else s)
    jid = job["id"]
    status = "queued"
    for _ in range(60):  # autoscaler loop runs it; tick manually if loop is off
        s, j = call("GET", f"{API}/tenant/jobs/{jid}", headers=tk)
        status = j.get("status")
        if status in ("succeeded", "failed"):
            break
        call("POST", f"{API}/scaling/tick", {}, op)
        time.sleep(1)
    check("job runs on an autoscaled worker", status == "succeeded", status)

    s, inv = call("GET", f"{API}/billing/{tid}/invoice", headers=op)
    check("draft invoice", s == 200 and inv["total_usd"] >= 1500,
          f"${inv.get('total_usd')}")
    s, att = call("GET", f"{API}/scaling/attribution/{tid}", headers=op)
    check("cost attribution", s == 200 and att["jobs"] >= 1,
          f"{att.get('billed_cpu_seconds')} CPU-s")
    s, au = call("GET", f"{API}/audit?tenant_id={tid}", headers=op)
    check("audit chain intact", s == 200 and au["chain_ok"], f"{len(au['events'])} events")
    s, b = call("GET", f"{API}/onboarding/{tid}/bundle", headers=op)
    check("deploy bundle renders", s == 200 and "podman-compose.yml" in b)

    print(f"\n{'ALL CHECKS PASSED' if not failures else f'{failures} CHECK(S) FAILED'}")
    print(f"Smoke-test client: {name} ({tid})")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
