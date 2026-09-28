"""Phase 4 — explicit plan -> act -> check execution graph.

Uses LangGraph's ``StateGraph`` when installed; otherwise a minimal built-in
graph with the same node/edge semantics so the platform runs fully offline.
The LLM is pluggable: default is a deterministic planner; ``OllamaLLM`` talks to
a self-hosted Ollama endpoint. LangSmith is intentionally never imported.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any, Protocol, TypedDict

import httpx

END = "__end__"


class AgentState(TypedDict, total=False):
    goal: str
    plan: list[str]
    step: int
    results: list[dict[str, Any]]
    attempts: int
    max_attempts: int
    done: bool
    verdict: str


class LLM(Protocol):
    def complete(self, prompt: str) -> str: ...


class RuleLLM:
    """Deterministic offline planner used in tests and air-gapped installs."""

    def complete(self, prompt: str) -> str:
        if prompt.startswith("PLAN:"):
            goal = prompt[5:].strip()
            parts = [p.strip() for p in goal.replace(" then ", ",").split(",")]
            return json.dumps([p for p in parts if p] or [goal])
        return "ok"


class OllamaLLM:
    def __init__(
        self, model: str = "llama3.1:8b", base_url: str = "http://localhost:11434"
    ) -> None:
        self.model = model
        self.base_url = base_url.rstrip("/")

    def complete(self, prompt: str) -> str:
        r = httpx.post(
            f"{self.base_url}/api/generate",
            json={"model": self.model, "prompt": prompt, "stream": False},
            timeout=120,
        )
        r.raise_for_status()
        return str(r.json().get("response", ""))


class _MiniGraph:
    """Tiny StateGraph stand-in: nodes, edges, conditional edges, compile/invoke."""

    def __init__(self, _schema: Any) -> None:
        self.nodes: dict[str, Callable[[AgentState], AgentState]] = {}
        self.edges: dict[str, str] = {}
        self.cond: dict[str, Callable[[AgentState], str]] = {}
        self.entry = ""

    def add_node(self, name: str, fn: Callable[[AgentState], AgentState]) -> None:
        self.nodes[name] = fn

    def add_edge(self, a: str, b: str) -> None:
        self.edges[a] = b

    def add_conditional_edges(
        self, a: str, fn: Callable[[AgentState], str], mapping: dict[str, str]
    ) -> None:
        self.cond[a] = lambda s: mapping[fn(s)]

    def set_entry_point(self, name: str) -> None:
        self.entry = name

    def compile(self) -> _MiniGraph:
        return self

    def invoke(self, state: AgentState, max_steps: int = 200) -> AgentState:
        node = self.entry
        for _ in range(max_steps):
            if node == END:
                return state
            state = {**state, **self.nodes[node](state)}
            node = self.cond[node](state) if node in self.cond else self.edges[node]
        raise RuntimeError("graph exceeded max_steps")


def _state_graph_cls() -> tuple[Any, str]:
    try:
        from langgraph.graph import StateGraph  # type: ignore[import-not-found]

        return StateGraph, "langgraph"
    except ImportError:
        return _MiniGraph, "builtin"


Tool = Callable[[str], Any]


class PlanActCheckAgent:
    def __init__(
        self,
        llm: LLM | None = None,
        tools: dict[str, Tool] | None = None,
        engine: str = "auto",
    ) -> None:
        self.llm = llm or RuleLLM()
        self.tools = tools or {}
        cls, name = (_MiniGraph, "builtin") if engine == "builtin" else _state_graph_cls()
        self.engine = name
        g = cls(AgentState)
        g.add_node("plan", self._plan)
        g.add_node("act", self._act)
        g.add_node("check", self._check)
        g.set_entry_point("plan")
        g.add_edge("plan", "act")
        g.add_edge("act", "check")
        g.add_conditional_edges(
            "check", self._route, {"act": "act", "plan": "plan", "end": END}
        )
        self.graph = g.compile()

    def _plan(self, s: AgentState) -> AgentState:
        raw = self.llm.complete(f"PLAN: {s['goal']}")
        try:
            plan = [str(x) for x in json.loads(raw)]
        except (json.JSONDecodeError, TypeError):
            plan = [line.strip("-* ").strip() for line in raw.splitlines() if line.strip()]
        return {"plan": plan or [s["goal"]], "step": 0, "results": [],
                "attempts": s.get("attempts", 0) + 1}

    def _act(self, s: AgentState) -> AgentState:
        task = s["plan"][s["step"]]
        name = task.split(":", 1)[0].strip().lower()
        try:
            if name in self.tools:
                arg = task.split(":", 1)[1].strip() if ":" in task else ""
                out, ok = self.tools[name](arg), True
            else:
                out, ok = self.llm.complete(f"ACT: {task}"), True
        except Exception as exc:  # noqa: BLE001 - surfaced to check node
            out, ok = f"error: {exc}", False
        return {"results": [*s["results"], {"task": task, "ok": ok, "output": out}]}

    def _check(self, s: AgentState) -> AgentState:
        last = s["results"][-1]
        if not last["ok"]:
            return {"verdict": "replan", "done": False}
        if s["step"] + 1 >= len(s["plan"]):
            return {"verdict": "complete", "done": True}
        return {"verdict": "continue", "step": s["step"] + 1, "done": False}

    def _route(self, s: AgentState) -> str:
        if s["verdict"] == "complete":
            return "end"
        if s["verdict"] == "replan":
            return "plan" if s["attempts"] < s.get("max_attempts", 2) else "end"
        return "act"

    def run(self, goal: str, max_attempts: int = 2) -> AgentState:
        out: AgentState = self.graph.invoke(
            {"goal": goal, "attempts": 0, "max_attempts": max_attempts}
        )
        out.setdefault("done", False)
        return out
