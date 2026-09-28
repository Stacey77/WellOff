"""Phase 1 — AI Factory: compute pools + deployment targets bound to backends."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

from src.empire.infra import InfraRegistry


class Environment(str, Enum):
    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"


ENV_BACKEND = {
    Environment.DEV: "podman",
    Environment.STAGING: "podman",
    Environment.PROD: "rancher",
}


@dataclass
class ComputePool:
    name: str
    gpus: int = 0
    cpus: int = 4
    memory_gb: int = 16
    allocated_cpus: int = 0

    @property
    def free_cpus(self) -> int:
        return self.cpus - self.allocated_cpus

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "gpus": self.gpus,
            "cpus": self.cpus,
            "memory_gb": self.memory_gb,
            "free_cpus": self.free_cpus,
        }


@dataclass
class Deployment:
    id: str
    app_id: str
    tenant_id: str | None
    environment: Environment
    backend: str
    pool: str
    cpus: int
    status: str = "running"
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "app_id": self.app_id,
            "tenant_id": self.tenant_id,
            "environment": self.environment.value,
            "backend": self.backend,
            "pool": self.pool,
            "cpus": self.cpus,
            "status": self.status,
            "created_at": self.created_at,
        }


class CapacityError(RuntimeError):
    pass


class AIFactory:
    def __init__(self, infra: InfraRegistry | None = None) -> None:
        self.infra = infra or InfraRegistry()
        self.pools: dict[str, ComputePool] = {
            "local-cpu": ComputePool("local-cpu", cpus=8, memory_gb=32),
            "local-gpu": ComputePool("local-gpu", gpus=1, cpus=8, memory_gb=64),
        }
        self.deployments: dict[str, Deployment] = {}

    def add_pool(self, pool: ComputePool) -> ComputePool:
        self.pools[pool.name] = pool
        return pool

    def deploy(
        self,
        app_id: str,
        environment: str | Environment = Environment.DEV,
        pool: str = "local-cpu",
        cpus: int = 1,
        tenant_id: str | None = None,
    ) -> Deployment:
        env = Environment(environment)
        if pool not in self.pools:
            raise KeyError(f"unknown pool {pool!r}")
        p = self.pools[pool]
        if cpus > p.free_cpus:
            raise CapacityError(f"pool {pool} has {p.free_cpus} free cpus")
        backend = ENV_BACKEND[env]
        self.infra.get(backend)
        p.allocated_cpus += cpus
        dep = Deployment(
            id=f"dep_{uuid.uuid4().hex[:10]}",
            app_id=app_id,
            tenant_id=tenant_id,
            environment=env,
            backend=backend,
            pool=pool,
            cpus=cpus,
        )
        self.deployments[dep.id] = dep
        return dep

    def teardown(self, deployment_id: str) -> Deployment:
        dep = self.deployments[deployment_id]
        if dep.status != "stopped":
            self.pools[dep.pool].allocated_cpus -= dep.cpus
            dep.status = "stopped"
        return dep
