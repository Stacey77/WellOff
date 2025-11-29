"""
n8n Integration Module
"""
from .n8n_client import N8NClient, WorkflowExecution, WorkflowDefinition, WorkflowStatus

__all__ = ["N8NClient", "WorkflowExecution", "WorkflowDefinition", "WorkflowStatus"]
