"""
WellOff AI Platform - FastAPI REST API

This module provides the REST API endpoints for the WellOff AI platform,
enabling interaction with all platform capabilities.
"""

from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import ConversationalAI, ActionType
from milvus_integration import MilvusClient
from n8n_integration import N8NClient
from multimodal_rag import MultimodalRAG, ContentModality
from voice_agent import VoiceAgent


# ============= Pydantic Models =============

class MessageRequest(BaseModel):
    """Request model for sending a message."""
    message: str = Field(..., description="The user message to process")
    session_id: Optional[str] = Field(None, description="Existing session ID or None to create new")


class ConfirmationRequest(BaseModel):
    """Request model for confirming/rejecting actions."""
    session_id: str
    action_id: str
    confirmed: bool


class DocumentRequest(BaseModel):
    """Request model for ingesting a document."""
    content: str
    modality: str = "text"
    metadata: Optional[Dict[str, Any]] = None


class SearchRequest(BaseModel):
    """Request model for searching."""
    query: str
    top_k: int = 5
    modality_filter: Optional[str] = None


class WorkflowRequest(BaseModel):
    """Request model for triggering a workflow."""
    workflow_id: str
    data: Dict[str, Any] = {}


class AIWorkflowRequest(BaseModel):
    """Request model for AI-powered workflow execution."""
    prompt: str
    workflow_type: str = "content"
    parameters: Optional[Dict[str, Any]] = None


class VoiceTextRequest(BaseModel):
    """Request model for voice text input."""
    text: str
    session_id: Optional[str] = None


# ============= Application Setup =============

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title="WellOff AI Platform",
        description="""
        A powerful conversational AI platform with:
        - **Conversational AI**: Interactive chat with confirmation flow
        - **Milvus Integration**: Vector database for semantic search
        - **n8n Integration**: Workflow automation
        - **Multimodal RAG**: Text, image, audio, and video processing
        - **Voice Agent**: Voice interaction capabilities
        """,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Initialize services
    app.state.conversational_ai = ConversationalAI()
    app.state.milvus_client = MilvusClient()
    app.state.n8n_client = N8NClient()
    app.state.rag = MultimodalRAG(milvus_client=app.state.milvus_client)
    app.state.voice_agent = VoiceAgent(conversational_ai=app.state.conversational_ai)
    
    # Connect to Milvus
    app.state.milvus_client.connect()
    
    return app


app = create_app()


# ============= Health & Info Endpoints =============

@app.get("/", tags=["Info"])
async def root():
    """Root endpoint with platform information."""
    return {
        "name": "WellOff AI Platform",
        "version": "1.0.0",
        "description": "A powerful conversational AI platform",
        "features": [
            "Conversational AI with confirmation flow",
            "Milvus vector database integration",
            "n8n workflow automation",
            "Multimodal RAG (text, image, audio, video)",
            "AI Voice Agent"
        ],
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "conversation": "/api/conversation",
            "rag": "/api/rag",
            "workflows": "/api/workflows",
            "voice": "/api/voice"
        }
    }


@app.get("/health", tags=["Info"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "conversational_ai": "active",
            "milvus": "connected" if app.state.milvus_client._connected else "disconnected",
            "n8n": "configured",
            "rag": "active",
            "voice_agent": "active"
        }
    }


# ============= Conversational AI Endpoints =============

@app.post("/api/conversation/message", tags=["Conversation"])
async def send_message(request: MessageRequest):
    """
    Send a message to the conversational AI.
    
    The AI will process the message and may propose actions that require
    confirmation before execution.
    """
    ai = app.state.conversational_ai
    
    # Create or get session
    if request.session_id:
        session = ai.get_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = ai.create_session()
    
    # Process message
    result = await ai.process_message(session.id, request.message)
    
    return result


@app.post("/api/conversation/confirm", tags=["Conversation"])
async def confirm_action(request: ConfirmationRequest):
    """Confirm or reject a proposed action."""
    ai = app.state.conversational_ai
    
    session = ai.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    action = session.confirm_action(request.action_id, request.confirmed)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    if request.confirmed:
        # Execute confirmed actions
        results = await ai.execute_confirmed_actions(request.session_id)
        return {
            "session_id": request.session_id,
            "action_id": request.action_id,
            "confirmed": True,
            "execution_results": results
        }
    else:
        return {
            "session_id": request.session_id,
            "action_id": request.action_id,
            "confirmed": False,
            "message": "Action cancelled"
        }


@app.get("/api/conversation/session/{session_id}", tags=["Conversation"])
async def get_session(session_id: str):
    """Get conversation session details."""
    ai = app.state.conversational_ai
    session = ai.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()


@app.get("/api/conversation/session/{session_id}/history", tags=["Conversation"])
async def get_conversation_history(session_id: str):
    """Get conversation history for a session."""
    ai = app.state.conversational_ai
    history = ai.get_conversation_history(session_id)
    if history is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "messages": history}


@app.delete("/api/conversation/session/{session_id}", tags=["Conversation"])
async def delete_session(session_id: str):
    """Delete a conversation session."""
    ai = app.state.conversational_ai
    if ai.delete_session(session_id):
        return {"message": "Session deleted", "session_id": session_id}
    raise HTTPException(status_code=404, detail="Session not found")


# ============= RAG Endpoints =============

@app.post("/api/rag/ingest", tags=["RAG"])
async def ingest_document(request: DocumentRequest):
    """Ingest a document into the RAG system."""
    rag = app.state.rag
    
    try:
        modality = ContentModality(request.modality)
    except ValueError:
        raise HTTPException(status_code=400, 
            detail=f"Invalid modality. Must be one of: {[m.value for m in ContentModality]}")
    
    result = await rag.ingest_content(
        content=request.content,
        modality=modality,
        metadata=request.metadata
    )
    
    return {
        "message": "Document ingested successfully",
        "document": result.to_dict()
    }


@app.post("/api/rag/ingest/file", tags=["RAG"])
async def ingest_file(file: UploadFile = File(...), modality: str = "text"):
    """Ingest a file into the RAG system."""
    rag = app.state.rag
    
    try:
        content_modality = ContentModality(modality)
    except ValueError:
        raise HTTPException(status_code=400,
            detail=f"Invalid modality. Must be one of: {[m.value for m in ContentModality]}")
    
    content = await file.read()
    
    # For text files, decode to string
    if content_modality == ContentModality.TEXT:
        content = content.decode('utf-8')
    
    result = await rag.ingest_content(
        content=content,
        modality=content_modality,
        metadata={"filename": file.filename, "content_type": file.content_type}
    )
    
    return {
        "message": "File ingested successfully",
        "filename": file.filename,
        "document": result.to_dict()
    }


@app.post("/api/rag/search", tags=["RAG"])
async def search_rag(request: SearchRequest):
    """Search the RAG system with a query."""
    rag = app.state.rag
    
    filter_modality = None
    if request.modality_filter:
        try:
            filter_modality = ContentModality(request.modality_filter)
        except ValueError:
            raise HTTPException(status_code=400,
                detail=f"Invalid modality filter. Must be one of: {[m.value for m in ContentModality]}")
    
    result = await rag.query(
        query=request.query,
        top_k=request.top_k,
        filter_modality=filter_modality
    )
    
    return result.to_dict()


@app.get("/api/rag/stats", tags=["RAG"])
async def get_rag_stats():
    """Get RAG system statistics."""
    return app.state.rag.get_stats()


# ============= Milvus Endpoints =============

@app.get("/api/milvus/stats", tags=["Milvus"])
async def get_milvus_stats():
    """Get Milvus collection statistics."""
    return app.state.milvus_client.get_collection_stats()


@app.delete("/api/milvus/document/{document_id}", tags=["Milvus"])
async def delete_milvus_document(document_id: str):
    """Delete a document from Milvus."""
    success = await app.state.milvus_client.delete_document(document_id)
    if success:
        return {"message": "Document deleted", "document_id": document_id}
    raise HTTPException(status_code=404, detail="Document not found")


# ============= n8n Workflow Endpoints =============

@app.get("/api/workflows", tags=["Workflows"])
async def list_workflows():
    """List all available workflows."""
    return {
        "workflows": app.state.n8n_client.list_workflows(),
        "workflow_types": app.state.n8n_client.get_available_workflow_types()
    }


@app.post("/api/workflows/trigger", tags=["Workflows"])
async def trigger_workflow(request: WorkflowRequest):
    """Trigger a workflow by ID."""
    result = await app.state.n8n_client.trigger_webhook(
        webhook_id=request.workflow_id,
        data=request.data
    )
    return result.to_dict()


@app.post("/api/workflows/ai", tags=["Workflows"])
async def execute_ai_workflow(request: AIWorkflowRequest):
    """Execute an AI-powered workflow based on natural language."""
    result = await app.state.n8n_client.execute_ai_workflow(
        prompt=request.prompt,
        workflow_type=request.workflow_type,
        parameters=request.parameters
    )
    return result


@app.get("/api/workflows/history", tags=["Workflows"])
async def get_workflow_history(workflow_id: Optional[str] = None, limit: int = 10):
    """Get workflow execution history."""
    return {
        "executions": app.state.n8n_client.get_execution_history(
            workflow_id=workflow_id,
            limit=limit
        )
    }


# ============= Voice Agent Endpoints =============

@app.post("/api/voice/session", tags=["Voice"])
async def create_voice_session():
    """Create a new voice session."""
    session = app.state.voice_agent.create_session()
    return session.to_dict()


@app.get("/api/voice/session/{session_id}", tags=["Voice"])
async def get_voice_session(session_id: str):
    """Get voice session details."""
    session = app.state.voice_agent.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Voice session not found")
    return session.to_dict()


@app.post("/api/voice/session/{session_id}/listen/start", tags=["Voice"])
async def start_listening(session_id: str):
    """Start listening for voice input."""
    result = await app.state.voice_agent.start_listening(session_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/voice/session/{session_id}/listen/stop", tags=["Voice"])
async def stop_listening(session_id: str):
    """Stop listening for voice input."""
    result = await app.state.voice_agent.stop_listening(session_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/voice/session/{session_id}/process/text", tags=["Voice"])
async def process_voice_text(session_id: str, request: VoiceTextRequest):
    """Process text input through voice agent (for testing without audio)."""
    result = await app.state.voice_agent.process_text(session_id, request.text)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/voice/session/{session_id}/process/audio", tags=["Voice"])
async def process_voice_audio(session_id: str, audio: UploadFile = File(...)):
    """Process audio input through voice agent."""
    audio_data = await audio.read()
    result = await app.state.voice_agent.process_audio(session_id, audio_data)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/voice/session/{session_id}/command", tags=["Voice"])
async def execute_voice_command(session_id: str, command: str):
    """Execute a voice command."""
    result = await app.state.voice_agent.execute_voice_command(session_id, command)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/api/voice/commands", tags=["Voice"])
async def get_voice_commands():
    """Get list of available voice commands."""
    return {"commands": app.state.voice_agent.get_available_commands()}


@app.get("/api/voice/session/{session_id}/stats", tags=["Voice"])
async def get_voice_session_stats(session_id: str):
    """Get voice session statistics."""
    stats = app.state.voice_agent.get_session_stats(session_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Voice session not found")
    return stats


@app.delete("/api/voice/session/{session_id}", tags=["Voice"])
async def delete_voice_session(session_id: str):
    """Delete a voice session."""
    if app.state.voice_agent.delete_session(session_id):
        return {"message": "Voice session deleted", "session_id": session_id}
    raise HTTPException(status_code=404, detail="Voice session not found")


# ============= WebSocket Endpoint for Real-time Communication =============

@app.websocket("/ws/conversation/{session_id}")
async def websocket_conversation(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time conversation.
    
    Allows streaming interaction with the conversational AI.
    """
    await websocket.accept()
    
    ai = app.state.conversational_ai
    session = ai.get_session(session_id)
    
    if not session:
        session = ai.create_session()
        await websocket.send_json({
            "type": "session_created",
            "session_id": session.id
        })
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                # Process message
                result = await ai.process_message(session.id, data.get("content", ""))
                await websocket.send_json({
                    "type": "response",
                    **result
                })
            
            elif data.get("type") == "confirm":
                # Handle confirmation
                action_id = data.get("action_id")
                confirmed = data.get("confirmed", False)
                
                if action_id:
                    action = session.confirm_action(action_id, confirmed)
                    if confirmed and action:
                        results = await ai.execute_confirmed_actions(session.id)
                        await websocket.send_json({
                            "type": "execution_result",
                            "action_id": action_id,
                            "results": results
                        })
                    else:
                        await websocket.send_json({
                            "type": "action_cancelled",
                            "action_id": action_id
                        })
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        pass


@app.websocket("/ws/voice/{session_id}")
async def websocket_voice(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time voice interaction.
    
    Allows streaming audio input and output.
    """
    await websocket.accept()
    
    voice_agent = app.state.voice_agent
    session = voice_agent.get_session(session_id)
    
    if not session:
        session = voice_agent.create_session()
        await websocket.send_json({
            "type": "session_created",
            "session_id": session.id
        })
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "audio":
                # Process audio chunk
                import base64
                audio_bytes = base64.b64decode(data.get("audio", ""))
                result = await voice_agent.process_audio(session.id, audio_bytes)
                await websocket.send_json({
                    "type": "voice_response",
                    **result
                })
            
            elif data.get("type") == "text":
                # Process text input
                result = await voice_agent.process_text(session.id, data.get("content", ""))
                await websocket.send_json({
                    "type": "voice_response",
                    **result
                })
            
            elif data.get("type") == "command":
                # Execute voice command
                result = await voice_agent.execute_voice_command(
                    session.id, data.get("command", "")
                )
                await websocket.send_json({
                    "type": "command_result",
                    **result
                })
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        pass


# Entry point for running the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
