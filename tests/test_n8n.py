"""
Tests for the n8n integration module
"""
import pytest
import asyncio

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from n8n_integration.n8n_client import N8NClient, WorkflowExecution, WorkflowStatus


class TestN8NClient:
    """Tests for the N8NClient class."""
    
    def test_client_initialization(self):
        """Test client initialization."""
        client = N8NClient(
            base_url="http://localhost:5678",
            api_key="test-key",
            webhook_path="/webhook"
        )
        
        assert client.base_url == "http://localhost:5678"
        assert client.api_key == "test-key"
        assert client.webhook_path == "/webhook"
    
    def test_workflow_templates_loaded(self):
        """Test that workflow templates are loaded."""
        client = N8NClient()
        
        workflows = client.list_workflows()
        
        assert len(workflows) > 0
        # Check for expected templates
        workflow_ids = [w["id"] for w in workflows]
        assert "template_doc_processing" in workflow_ids
        assert "template_content_gen" in workflow_ids
    
    def test_get_workflow(self):
        """Test getting a workflow by ID."""
        client = N8NClient()
        
        workflow = client.get_workflow("template_doc_processing")
        
        assert workflow is not None
        assert workflow.name == "Document Processing"
    
    def test_get_available_workflow_types(self):
        """Test getting available workflow types."""
        client = N8NClient()
        
        types = client.get_available_workflow_types()
        
        assert len(types) > 0
        type_names = [t["type"] for t in types]
        assert "document" in type_names
        assert "content" in type_names
    
    @pytest.mark.asyncio
    async def test_trigger_webhook(self):
        """Test triggering a webhook."""
        client = N8NClient()
        
        execution = await client.trigger_webhook(
            webhook_id="template_content_gen",
            data={"prompt": "Generate content"}
        )
        
        assert execution is not None
        assert execution.workflow_id == "template_content_gen"
        assert execution.status in [WorkflowStatus.SUCCESS, WorkflowStatus.RUNNING]
    
    @pytest.mark.asyncio
    async def test_create_workflow(self):
        """Test creating a new workflow."""
        client = N8NClient()
        
        workflow = await client.create_workflow(
            name="Test Workflow",
            description="A test workflow",
            nodes=[{"name": "Start", "type": "n8n-nodes-base.start"}],
            active=True
        )
        
        assert workflow is not None
        assert workflow.name == "Test Workflow"
        assert workflow.active is True
    
    @pytest.mark.asyncio
    async def test_delete_workflow(self):
        """Test deleting a workflow."""
        client = N8NClient()
        
        # Create a workflow first
        workflow = await client.create_workflow(
            name="To Delete",
            description="Will be deleted",
            nodes=[]
        )
        
        result = await client.delete_workflow(workflow.id)
        
        assert result is True
        assert client.get_workflow(workflow.id) is None
    
    def test_get_execution_history(self):
        """Test getting execution history."""
        client = N8NClient()
        
        history = client.get_execution_history(limit=5)
        
        assert isinstance(history, list)
    
    @pytest.mark.asyncio
    async def test_execute_ai_workflow(self):
        """Test executing an AI-powered workflow."""
        client = N8NClient()
        
        result = await client.execute_ai_workflow(
            prompt="Generate a blog post about AI",
            workflow_type="content"
        )
        
        assert "execution_id" in result
        assert "status" in result
        assert result["status"] in ["success", "running"]


class TestWorkflowExecution:
    """Tests for the WorkflowExecution dataclass."""
    
    def test_execution_to_dict(self):
        """Test converting execution to dict."""
        from datetime import datetime
        
        execution = WorkflowExecution(
            id="exec-id",
            workflow_id="workflow-1",
            workflow_name="Test Workflow",
            status=WorkflowStatus.SUCCESS,
            input_data={"key": "value"},
            output_data={"result": "done"},
            error_message=None,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        
        result = execution.to_dict()
        
        assert result["id"] == "exec-id"
        assert result["status"] == "success"
        assert result["input_data"] == {"key": "value"}
