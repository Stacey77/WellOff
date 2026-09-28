import asyncio
import json

from src.empire.graph import PlanActCheckAgent, RuleLLM
from src.empire.mcp_server import TOOL_NAMES, build_server, build_tools
from src.empire.platform import EmpirePlatform


def test_nine_tools_callable():
    p = EmpirePlatform()
    t = build_tools(p)
    assert len(t) == 9 and tuple(t) == TOOL_NAMES
    app = t["foundry_scaffold_app"]("bot", "support-bot")
    dep = t["factory_deploy"](app["id"])
    assert dep["backend"] == "podman"
    assert t["factory_teardown"](dep["id"])["status"] == "stopped"
    assert t["platform_snapshot"]()["pillars"]["foundry"]["apps"] == 1


def test_fastmcp_server_registers_tools_and_respects_allowlist():
    full = asyncio.run(build_server(EmpirePlatform()).list_tools())
    assert {x.name for x in full} == set(TOOL_NAMES)
    part = asyncio.run(build_server(EmpirePlatform(),
                                    ["platform_snapshot"]).list_tools())
    assert [x.name for x in part] == ["platform_snapshot"]


def test_plan_act_check_completes_with_tools():
    agent = PlanActCheckAgent(tools={"echo": lambda a: a.upper()}, engine="builtin")
    out = agent.run("echo: hi, echo: there")
    assert out["done"] and out["verdict"] == "complete"
    assert [r["output"] for r in out["results"]] == ["HI", "THERE"]


class FlakyLLM(RuleLLM):
    def __init__(self):
        self.plans = 0

    def complete(self, prompt):
        if prompt.startswith("PLAN:"):
            self.plans += 1
            return json.dumps(["boom"] if self.plans == 1 else ["fine"])
        return "ok"


def test_failed_step_triggers_replan():
    def boom(_):
        raise RuntimeError("x")
    llm = FlakyLLM()
    out = PlanActCheckAgent(llm, {"boom": boom}, engine="builtin").run("g")
    assert llm.plans == 2 and out["done"]


def test_replan_gives_up_after_max_attempts():
    def boom(_):
        raise RuntimeError("x")
    out = PlanActCheckAgent(tools={"boom": boom}, engine="builtin").run("boom", 2)
    assert not out["done"] and out["attempts"] == 2


def test_non_json_plan_is_parsed_line_by_line():
    class L(RuleLLM):
        def complete(self, prompt):
            return "- a\n- b" if prompt.startswith("PLAN") else "ok"
    out = PlanActCheckAgent(L(), engine="builtin").run("x")
    assert [r["task"] for r in out["results"]] == ["a", "b"]
