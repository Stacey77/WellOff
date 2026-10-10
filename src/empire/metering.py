"""Phase 7 — per-tenant usage metering, pricing tiers and invoice drafts.

Pricing mirrors the Nova Digitus sales package:
  strategy  $300 one-time session
  pilot     $1,500 one-time (range $500–2,500)
  retainer  $2,000 / month (range $1,000–3,000) with included usage
Phase 9 adds ``cpu_second`` (scaled-worker compute): pilot includes 10 CPU-hours,
retainer 100 CPU-hours/month; overage $1.80 / $1.08 per CPU-hour.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from src.empire.onboarding import Tier


@dataclass(frozen=True)
class Plan:
    tier: Tier
    base_usd: float
    recurring: bool
    included: dict[str, int]
    overage_usd: dict[str, float]


PLANS: dict[Tier, Plan] = {
    Tier.STRATEGY: Plan(Tier.STRATEGY, 300.0, False, {}, {}),
    Tier.PILOT: Plan(
        Tier.PILOT, 1500.0, False,
        {"agent_run": 500, "mcp_call": 2000, "deployment": 2, "cpu_second": 36_000},
        {"agent_run": 0.05, "mcp_call": 0.01, "deployment": 50.0, "cpu_second": 0.0005},
    ),
    Tier.RETAINER: Plan(
        Tier.RETAINER, 2000.0, True,
        {"agent_run": 5000, "mcp_call": 20000, "deployment": 10, "cpu_second": 360_000},
        {"agent_run": 0.03, "mcp_call": 0.005, "deployment": 40.0, "cpu_second": 0.0003},
    ),
}


@dataclass
class Account:
    tenant_id: str
    tier: Tier
    usage: dict[str, int] = field(default_factory=lambda: defaultdict(int))


class Metering:
    def __init__(self) -> None:
        self.accounts: dict[str, Account] = {}

    def open_account(self, tenant_id: str, tier: Tier | str) -> Account:
        acct = Account(tenant_id, Tier(tier))
        self.accounts[tenant_id] = acct
        return acct

    def record(self, tenant_id: str, metric: str, qty: int = 1) -> None:
        if qty < 0:
            raise ValueError("qty must be >= 0")
        if tenant_id not in self.accounts:
            raise KeyError(f"no metering account for {tenant_id!r}")
        self.accounts[tenant_id].usage[metric] += qty

    def change_tier(self, tenant_id: str, tier: Tier | str) -> Account:
        acct = self.accounts[tenant_id]
        acct.tier = Tier(tier)
        return acct

    def invoice(self, tenant_id: str, period: str | None = None) -> dict[str, Any]:
        acct = self.accounts[tenant_id]
        plan = PLANS[acct.tier]
        lines: list[dict[str, Any]] = [{
            "description": f"{plan.tier.value.title()} "
                           f"{'(monthly)' if plan.recurring else '(one-time)'}",
            "qty": 1, "unit_usd": plan.base_usd, "amount_usd": plan.base_usd,
        }]
        for metric, used in sorted(acct.usage.items()):
            over = max(0, used - plan.included.get(metric, 0))
            rate = plan.overage_usd.get(metric, 0.0)
            if over and rate:
                lines.append({"description": f"{metric} overage", "qty": over,
                              "unit_usd": rate, "amount_usd": round(over * rate, 2)})
        total = round(sum(line["amount_usd"] for line in lines), 2)
        return {
            "tenant_id": tenant_id,
            "tier": acct.tier.value,
            "period": period or datetime.now(UTC).strftime("%Y-%m"),
            "status": "draft",
            "usage": dict(acct.usage),
            "included": plan.included,
            "lines": lines,
            "total_usd": total,
        }
