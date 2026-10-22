"""
Tests for the Conversational AI module
"""
import pytest
import asyncio
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from core.conversational_ai import (
    ConversationalAI,
    ConversationSession,
    ConversationState,
    ActionType,
    ProposedAction,
    Message
)


class TestMessage:
    """Tests for the Message dataclass."""
    
    def test_message_creation(self):
        """Test creating a message."""
        msg = Message(
            id="test-id",
            role="user",
            content="Hello",
            timestamp=datetime.utcnow(),
            metadata={"key": "value"}
        )
        
        assert msg.id == "test-id"
        assert msg.role == "user"
        assert msg.content == "Hello"
        assert msg.metadata == {"key": "value"}
    
    def test_message_to_dict(self):
        """Test converting message to dict."""
        msg = Message(
            id="test-id",
            role="user",
            content="Hello",
            timestamp=datetime.utcnow()
        )
        
        result = msg.to_dict()
        assert result["id"] == "test-id"
        assert result["role"] == "user"
        assert result["content"] == "Hello"
        assert "timestamp" in result


class TestProposedAction:
    """Tests for the ProposedAction dataclass."""
    
    def test_action_creation(self):
        """Test creating a proposed action."""
        action = ProposedAction(
            id="action-id",
            action_type=ActionType.CREATE,
            description="Create a document",
            details={"type": "document"},
            created_at=datetime.utcnow()
        )
        
        assert action.id == "action-id"
        assert action.action_type == ActionType.CREATE
        assert action.confirmed is None
        assert action.executed is False
    
    def test_action_to_dict(self):
        """Test converting action to dict."""
        action = ProposedAction(
            id="action-id",
            action_type=ActionType.CREATE,
            description="Create a document",
            details={"type": "document"},
            created_at=datetime.utcnow()
        )
        
        result = action.to_dict()
        assert result["id"] == "action-id"
        assert result["action_type"] == "create"
        assert result["description"] == "Create a document"


class TestConversationSession:
    """Tests for the ConversationSession class."""
    
    def test_session_add_message(self):
        """Test adding messages to a session."""
        session = ConversationSession(
            id="session-id",
            state=ConversationState.IDLE,
            messages=[],
            pending_actions=[],
            context={},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        msg = session.add_message("user", "Hello")
        
        assert len(session.messages) == 1
        assert session.messages[0].role == "user"
        assert session.messages[0].content == "Hello"
    
    def test_session_add_pending_action(self):
        """Test adding pending actions."""
        session = ConversationSession(
            id="session-id",
            state=ConversationState.IDLE,
            messages=[],
            pending_actions=[],
            context={},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        action = session.add_pending_action(
            ActionType.CREATE,
            "Create something",
            {"key": "value"}
        )
        
        assert len(session.pending_actions) == 1
        assert session.state == ConversationState.AWAITING_CONFIRMATION
        assert action.description == "Create something"
    
    def test_session_confirm_action(self):
        """Test confirming an action."""
        session = ConversationSession(
            id="session-id",
            state=ConversationState.IDLE,
            messages=[],
            pending_actions=[],
            context={},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        action = session.add_pending_action(
            ActionType.CREATE,
            "Create something",
            {}
        )
        
        confirmed = session.confirm_action(action.id, True)
        
        assert confirmed is not None
        assert confirmed.confirmed is True
    
    def test_session_reject_action(self):
        """Test rejecting an action."""
        session = ConversationSession(
            id="session-id",
            state=ConversationState.IDLE,
            messages=[],
            pending_actions=[],
            context={},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        action = session.add_pending_action(
            ActionType.CREATE,
            "Create something",
            {}
        )
        
        rejected = session.confirm_action(action.id, False)
        
        assert rejected is not None
        assert rejected.confirmed is False
        # Action should be removed when rejected
        assert len(session.pending_actions) == 0


class TestConversationalAI:
    """Tests for the ConversationalAI class."""
    
    def test_create_session(self):
        """Test creating a conversation session."""
        ai = ConversationalAI()
        session = ai.create_session()
        
        assert session is not None
        assert session.id in ai.sessions
        assert len(session.messages) == 1  # System message
        assert session.messages[0].role == "system"
    
    def test_get_session(self):
        """Test getting an existing session."""
        ai = ConversationalAI()
        session = ai.create_session()
        
        retrieved = ai.get_session(session.id)
        
        assert retrieved is not None
        assert retrieved.id == session.id
    
    def test_get_nonexistent_session(self):
        """Test getting a non-existent session."""
        ai = ConversationalAI()
        
        retrieved = ai.get_session("nonexistent-id")
        
        assert retrieved is None
    
    def test_delete_session(self):
        """Test deleting a session."""
        ai = ConversationalAI()
        session = ai.create_session()
        
        result = ai.delete_session(session.id)
        
        assert result is True
        assert ai.get_session(session.id) is None
    
    @pytest.mark.asyncio
    async def test_process_message(self):
        """Test processing a message."""
        ai = ConversationalAI()
        session = ai.create_session()
        
        result = await ai.process_message(session.id, "Hello, AI!")
        
        assert "session_id" in result
        assert result["session_id"] == session.id
        assert "message" in result
    
    @pytest.mark.asyncio
    async def test_process_create_request(self):
        """Test processing a create request."""
        ai = ConversationalAI()
        session = ai.create_session()
        
        result = await ai.process_message(session.id, "Create a document for me")
        
        assert "pending_actions" in result
        # Should have pending actions for create requests
        assert len(result["pending_actions"]) > 0
    
    @pytest.mark.asyncio
    async def test_confirmation_flow(self):
        """Test the confirmation flow."""
        ai = ConversationalAI()
        session = ai.create_session()
        
        # First message - create request
        result = await ai.process_message(session.id, "Create a document")
        assert len(result.get("pending_actions", [])) > 0
        
        # Confirm the action
        confirm_result = await ai.process_message(session.id, "yes")
        assert "confirmed_actions" in confirm_result or "message" in confirm_result
    
    @pytest.mark.asyncio
    async def test_rejection_flow(self):
        """Test the rejection flow."""
        ai = ConversationalAI()
        session = ai.create_session()
        
        # First message - create request
        result = await ai.process_message(session.id, "Create a document")
        assert len(result.get("pending_actions", [])) > 0
        
        # Reject the action
        reject_result = await ai.process_message(session.id, "no")
        assert "cancelled_actions" in reject_result or "message" in reject_result
    
    def test_get_conversation_history(self):
        """Test getting conversation history."""
        ai = ConversationalAI()
        session = ai.create_session()
        session.add_message("user", "Hello")
        session.add_message("assistant", "Hi there!")
        
        history = ai.get_conversation_history(session.id)
        
        assert history is not None
        assert len(history) == 3  # System + user + assistant
    
    @pytest.mark.asyncio
    async def test_execute_confirmed_actions(self):
        """Test executing confirmed actions."""
        ai = ConversationalAI()
        session = ai.create_session()
        
        # Add and confirm an action
        action = session.add_pending_action(
            ActionType.CREATE,
            "Test action",
            {"test": True}
        )
        action.confirmed = True
        
        results = await ai.execute_confirmed_actions(session.id)
        
        assert len(results) > 0
        # Action should have been executed
        assert results[0]["action_id"] == action.id
