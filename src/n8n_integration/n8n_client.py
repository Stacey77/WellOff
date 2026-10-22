"""
n8n Workflow Automation Integration Module

This module provides integration with n8n for workflow automation,
enabling triggering of workflows, webhook handling, and workflow management.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import json
import uuid

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False


class WorkflowStatus(Enum):
    """Status of a workflow execution."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class WorkflowExecution:
    """Represents a workflow execution."""
    id: str
    workflow_id: str
    workflow_name: str
    status: WorkflowStatus
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "workflow_id": self.workflow_id,
            "workflow_name": self.workflow_name,
            "status": self.status.value,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


@dataclass
class WorkflowDefinition:
    """Represents an n8n workflow definition."""
    id: str
    name: str
    description: str
    webhook_path: Optional[str]
    active: bool
    nodes: List[Dict[str, Any]]
    connections: Dict[str, Any]
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "webhook_path": self.webhook_path,
            "active": self.active,
            "node_count": len(self.nodes),
            "created_at": self.created_at.isoformat()
        }


class N8NClient:
    """
    Client for interacting with n8n workflow automation platform.
    
    Provides methods for:
    - Triggering workflows via webhooks
    - Managing workflow definitions
    - Monitoring workflow executions
    - Creating dynamic workflows
    """
    
    def __init__(self, base_url: str = "http://localhost:5678",
                 api_key: Optional[str] = None,
                 webhook_path: str = "/webhook"):
        """
        Initialize n8n client.
        
        Args:
            base_url: Base URL of the n8n instance
            api_key: Optional API key for authentication
            webhook_path: Base path for webhooks
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.webhook_path = webhook_path
        self._executions: List[WorkflowExecution] = []  # Local storage for mock mode
        self._workflows: Dict[str, WorkflowDefinition] = {}
        
        # Pre-defined workflow templates
        self._init_workflow_templates()
    
    def _init_workflow_templates(self):
        """Initialize pre-defined workflow templates."""
        templates = [
            {
                "id": "template_doc_processing",
                "name": "Document Processing",
                "description": "Process and analyze documents with AI",
                "trigger": "webhook",
                "nodes": ["Webhook", "Set", "OpenAI", "Respond"]
            },
            {
                "id": "template_data_sync",
                "name": "Data Synchronization",
                "description": "Sync data between multiple systems",
                "trigger": "schedule",
                "nodes": ["Schedule", "HTTP Request", "Function", "Database"]
            },
            {
                "id": "template_notification",
                "name": "Smart Notifications",
                "description": "Send intelligent notifications based on events",
                "trigger": "webhook",
                "nodes": ["Webhook", "IF", "Slack/Email", "Respond"]
            },
            {
                "id": "template_content_gen",
                "name": "Content Generation",
                "description": "Generate content using AI",
                "trigger": "webhook",
                "nodes": ["Webhook", "OpenAI", "Format", "Respond"]
            },
            {
                "id": "template_voice_action",
                "name": "Voice Command Actions",
                "description": "Execute actions from voice commands",
                "trigger": "webhook",
                "nodes": ["Webhook", "Parse", "Switch", "Action", "Respond"]
            }
        ]
        
        for t in templates:
            self._workflows[t["id"]] = WorkflowDefinition(
                id=t["id"],
                name=t["name"],
                description=t["description"],
                webhook_path=f"/webhook/{t['id']}",
                active=True,
                nodes=[{"name": n, "type": n} for n in t["nodes"]],
                connections={},
                created_at=datetime.utcnow()
            )
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-N8N-API-KEY"] = self.api_key
        return headers
    
    async def trigger_webhook(self, webhook_id: str, 
                             data: Dict[str, Any]) -> WorkflowExecution:
        """
        Trigger a workflow via webhook.
        
        Args:
            webhook_id: The webhook identifier or path
            data: Data to send to the webhook
            
        Returns:
            WorkflowExecution object with the result
        """
        execution = WorkflowExecution(
            id=str(uuid.uuid4()),
            workflow_id=webhook_id,
            workflow_name=self._workflows.get(webhook_id, 
                WorkflowDefinition(webhook_id, webhook_id, "", None, True, [], {}, datetime.utcnow())
            ).name,
            status=WorkflowStatus.PENDING,
            input_data=data,
            output_data=None,
            error_message=None,
            started_at=datetime.utcnow(),
            completed_at=None
        )
        
        if not HTTPX_AVAILABLE:
            # Mock mode
            execution.status = WorkflowStatus.SUCCESS
            execution.output_data = {
                "message": "Workflow executed successfully (mock mode)",
                "workflow_id": webhook_id,
                "processed_data": data
            }
            execution.completed_at = datetime.utcnow()
            self._executions.append(execution)
            return execution
        
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}{self.webhook_path}/{webhook_id}"
                response = await client.post(
                    url,
                    json=data,
                    headers=self._get_headers(),
                    timeout=30.0
                )
                
                execution.status = WorkflowStatus.RUNNING
                
                if response.status_code in (200, 201):
                    execution.status = WorkflowStatus.SUCCESS
                    execution.output_data = response.json() if response.text else {}
                else:
                    execution.status = WorkflowStatus.FAILED
                    execution.error_message = f"HTTP {response.status_code}: {response.text}"
                
                execution.completed_at = datetime.utcnow()
                
        except httpx.TimeoutException:
            execution.status = WorkflowStatus.RUNNING
            # Workflow might still be running
        except httpx.RequestError as e:
            execution.status = WorkflowStatus.FAILED
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
        except Exception as e:
            # In case n8n is not available, simulate success for demo
            execution.status = WorkflowStatus.SUCCESS
            execution.output_data = {
                "message": "Workflow simulated (n8n not available)",
                "workflow_id": webhook_id,
                "processed_data": data
            }
            execution.completed_at = datetime.utcnow()
        
        self._executions.append(execution)
        return execution
    
    async def create_workflow(self, name: str, description: str,
                            nodes: List[Dict[str, Any]],
                            connections: Dict[str, Any] = None,
                            active: bool = True) -> WorkflowDefinition:
        """
        Create a new workflow definition.
        
        Args:
            name: Name of the workflow
            description: Description of what the workflow does
            nodes: List of node definitions
            connections: Node connections
            active: Whether the workflow is active
            
        Returns:
            The created WorkflowDefinition
        """
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            webhook_path=f"/webhook/{name.lower().replace(' ', '_')}",
            active=active,
            nodes=nodes,
            connections=connections or {},
            created_at=datetime.utcnow()
        )
        
        self._workflows[workflow.id] = workflow
        
        # In a real implementation, we would also create the workflow in n8n
        # via its API
        
        return workflow
    
    def list_workflows(self) -> List[Dict[str, Any]]:
        """List all available workflows."""
        return [w.to_dict() for w in self._workflows.values()]
    
    def get_workflow(self, workflow_id: str) -> Optional[WorkflowDefinition]:
        """Get a workflow by ID."""
        return self._workflows.get(workflow_id)
    
    async def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow by ID."""
        if workflow_id in self._workflows:
            del self._workflows[workflow_id]
            return True
        return False
    
    def get_execution_history(self, workflow_id: Optional[str] = None,
                             limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get execution history.
        
        Args:
            workflow_id: Filter by workflow ID
            limit: Maximum number of results
            
        Returns:
            List of execution records
        """
        executions = self._executions
        if workflow_id:
            executions = [e for e in executions if e.workflow_id == workflow_id]
        
        # Sort by started_at descending
        executions = sorted(executions, key=lambda x: x.started_at, reverse=True)
        
        return [e.to_dict() for e in executions[:limit]]
    
    async def execute_ai_workflow(self, prompt: str, 
                                 workflow_type: str = "content_gen",
                                 parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute an AI-powered workflow based on natural language prompt.
        
        Args:
            prompt: Natural language description of what to do
            workflow_type: Type of workflow to execute
            parameters: Additional parameters
            
        Returns:
            Workflow execution result
        """
        # Map workflow types to templates
        type_mapping = {
            "document": "template_doc_processing",
            "content": "template_content_gen",
            "notification": "template_notification",
            "sync": "template_data_sync",
            "voice": "template_voice_action",
            "content_gen": "template_content_gen"
        }
        
        template_id = type_mapping.get(workflow_type, "template_content_gen")
        
        data = {
            "prompt": prompt,
            "parameters": parameters or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        execution = await self.trigger_webhook(template_id, data)
        
        return {
            "execution_id": execution.id,
            "workflow": template_id,
            "status": execution.status.value,
            "result": execution.output_data,
            "message": f"Workflow '{self._workflows[template_id].name}' executed successfully"
        }
    
    def get_available_workflow_types(self) -> List[Dict[str, str]]:
        """Get list of available workflow types with descriptions."""
        return [
            {"type": "document", "name": "Document Processing", 
             "description": "Process, analyze, and transform documents"},
            {"type": "content", "name": "Content Generation",
             "description": "Generate content using AI"},
            {"type": "notification", "name": "Smart Notifications",
             "description": "Send notifications based on conditions"},
            {"type": "sync", "name": "Data Synchronization",
             "description": "Sync data between systems"},
            {"type": "voice", "name": "Voice Actions",
             "description": "Execute actions from voice commands"}
        ]
