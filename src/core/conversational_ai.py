"""
Conversational AI Core Module

This module provides the core conversational AI functionality with a confirmation flow
that asks users to confirm actions before executing them.
"""

from typing import Optional, Dict, Any, List, Callable, Awaitable
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import uuid
import json


class ConversationState(Enum):
    """States of a conversation."""
    IDLE = "idle"
    AWAITING_INPUT = "awaiting_input"
    PROCESSING = "processing"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    EXECUTING = "executing"
    COMPLETED = "completed"
    ERROR = "error"


class ActionType(Enum):
    """Types of actions the AI can perform."""
    CREATE = "create"
    MODIFY = "modify"
    DELETE = "delete"
    QUERY = "query"
    WORKFLOW = "workflow"
    VOICE = "voice"


@dataclass
class ProposedAction:
    """Represents an action proposed by the AI awaiting user confirmation."""
    id: str
    action_type: ActionType
    description: str
    details: Dict[str, Any]
    created_at: datetime
    confirmed: Optional[bool] = None
    executed: bool = False
    result: Optional[Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "action_type": self.action_type.value,
            "description": self.description,
            "details": self.details,
            "created_at": self.created_at.isoformat(),
            "confirmed": self.confirmed,
            "executed": self.executed,
            "result": self.result
        }


@dataclass
class Message:
    """Represents a message in the conversation."""
    id: str
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }


@dataclass
class ConversationSession:
    """Represents a conversation session with the AI."""
    id: str
    state: ConversationState
    messages: List[Message]
    pending_actions: List[ProposedAction]
    context: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    def add_message(self, role: str, content: str, metadata: Dict[str, Any] = None) -> Message:
        """Add a message to the conversation."""
        message = Message(
            id=str(uuid.uuid4()),
            role=role,
            content=content,
            timestamp=datetime.utcnow(),
            metadata=metadata or {}
        )
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        return message
    
    def add_pending_action(self, action_type: ActionType, description: str, 
                          details: Dict[str, Any]) -> ProposedAction:
        """Add a pending action awaiting confirmation."""
        action = ProposedAction(
            id=str(uuid.uuid4()),
            action_type=action_type,
            description=description,
            details=details,
            created_at=datetime.utcnow()
        )
        self.pending_actions.append(action)
        self.state = ConversationState.AWAITING_CONFIRMATION
        self.updated_at = datetime.utcnow()
        return action
    
    def get_pending_action(self, action_id: str) -> Optional[ProposedAction]:
        """Get a pending action by ID."""
        for action in self.pending_actions:
            if action.id == action_id:
                return action
        return None
    
    def confirm_action(self, action_id: str, confirmed: bool) -> Optional[ProposedAction]:
        """Confirm or reject a pending action."""
        action = self.get_pending_action(action_id)
        if action:
            action.confirmed = confirmed
            if not confirmed:
                self.pending_actions.remove(action)
            self.updated_at = datetime.utcnow()
        return action
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "state": self.state.value,
            "messages": [m.to_dict() for m in self.messages],
            "pending_actions": [a.to_dict() for a in self.pending_actions],
            "context": self.context,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class ConversationalAI:
    """
    Core conversational AI engine with confirmation flow.
    
    This engine processes user inputs, proposes actions, and waits for user
    confirmation before executing any changes. It maintains conversation context
    and supports multiple simultaneous sessions.
    """
    
    def __init__(self, llm_client: Any = None):
        """Initialize the conversational AI engine."""
        self.sessions: Dict[str, ConversationSession] = {}
        self.llm_client = llm_client
        self.action_handlers: Dict[ActionType, Callable[[ProposedAction], Awaitable[Any]]] = {}
        
        # System prompt that enforces confirmation behavior
        self.system_prompt = """You are WellOff AI, a powerful and helpful assistant that creates exactly what users ask for.

IMPORTANT BEHAVIOR:
1. When a user asks you to create, modify, or perform any action, you MUST first describe what you will do.
2. ALWAYS ask "Is this what you want?" or similar confirmation before proceeding.
3. Only proceed with the action after the user confirms.
4. If the user says no or wants changes, ask clarifying questions.
5. Be conversational, friendly, and precise.

You have access to:
- Document creation and editing
- Code generation
- Workflow automation via n8n
- Vector search via Milvus
- Multimodal content processing (text, images, audio, video)
- Voice interaction capabilities

Always explain your proposed actions clearly before asking for confirmation."""

    def create_session(self, context: Dict[str, Any] = None) -> ConversationSession:
        """Create a new conversation session."""
        session = ConversationSession(
            id=str(uuid.uuid4()),
            state=ConversationState.IDLE,
            messages=[],
            pending_actions=[],
            context=context or {},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Add system message
        session.add_message("system", self.system_prompt)
        
        self.sessions[session.id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[ConversationSession]:
        """Get an existing conversation session."""
        return self.sessions.get(session_id)
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a conversation session."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
    
    def register_action_handler(self, action_type: ActionType, 
                                handler: Callable[[ProposedAction], Awaitable[Any]]):
        """Register a handler for a specific action type."""
        self.action_handlers[action_type] = handler
    
    async def process_message(self, session_id: str, user_input: str) -> Dict[str, Any]:
        """
        Process a user message and generate a response.
        
        This method:
        1. Adds the user message to the conversation
        2. Analyzes the intent
        3. If an action is needed, proposes it and asks for confirmation
        4. If confirming a pending action, executes it
        
        Returns a response dict with the assistant's message and any pending actions.
        """
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found", "session_id": session_id}
        
        # Add user message
        session.add_message("user", user_input)
        session.state = ConversationState.PROCESSING
        
        # Check if this is a confirmation response
        if session.pending_actions:
            confirmation_result = self._check_confirmation(user_input, session)
            if confirmation_result:
                return confirmation_result
        
        # Generate AI response using LLM
        response = await self._generate_response(session)
        
        return response
    
    def _check_confirmation(self, user_input: str, 
                           session: ConversationSession) -> Optional[Dict[str, Any]]:
        """Check if the user input is a confirmation response."""
        input_lower = user_input.lower().strip()
        
        # Positive confirmations
        positive_responses = ['yes', 'y', 'yeah', 'yep', 'sure', 'ok', 'okay', 
                            'do it', 'proceed', 'confirm', 'go ahead', 'approved',
                            'that\'s right', 'correct', 'exactly']
        
        # Negative confirmations
        negative_responses = ['no', 'n', 'nope', 'cancel', 'stop', 'don\'t', 
                            'not what i want', 'wrong', 'incorrect', 'change it']
        
        is_positive = any(resp in input_lower for resp in positive_responses)
        is_negative = any(resp in input_lower for resp in negative_responses)
        
        if is_positive and session.pending_actions:
            # Confirm all pending actions
            results = []
            for action in session.pending_actions[:]:
                action.confirmed = True
                results.append({
                    "action_id": action.id,
                    "status": "confirmed",
                    "description": action.description
                })
            
            session.state = ConversationState.EXECUTING
            
            # Add confirmation message
            session.add_message("assistant", 
                "Great! I'm executing your request now. I'll let you know when it's done.")
            
            return {
                "session_id": session.id,
                "state": session.state.value,
                "message": "Actions confirmed and being executed.",
                "confirmed_actions": results,
                "pending_actions": [a.to_dict() for a in session.pending_actions]
            }
        
        elif is_negative and session.pending_actions:
            # Cancel pending actions
            cancelled = []
            for action in session.pending_actions[:]:
                action.confirmed = False
                cancelled.append(action.description)
                session.pending_actions.remove(action)
            
            session.state = ConversationState.AWAITING_INPUT
            
            session.add_message("assistant", 
                "I understand. Let me know what changes you'd like me to make, "
                "or describe what you're looking for differently.")
            
            return {
                "session_id": session.id,
                "state": session.state.value,
                "message": "Actions cancelled. Please provide new instructions.",
                "cancelled_actions": cancelled,
                "pending_actions": []
            }
        
        return None
    
    async def _generate_response(self, session: ConversationSession) -> Dict[str, Any]:
        """Generate an AI response using the LLM."""
        
        # If no LLM client, return a mock response
        if not self.llm_client:
            return self._generate_mock_response(session)
        
        # Build messages for LLM
        messages = [{"role": m.role, "content": m.content} for m in session.messages]
        
        try:
            # Call LLM
            response = await self.llm_client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7
            )
            
            assistant_message = response.choices[0].message.content
            
            # Analyze if this proposes an action
            action_proposed = self._analyze_for_action(assistant_message, session)
            
            session.add_message("assistant", assistant_message)
            
            if action_proposed:
                session.state = ConversationState.AWAITING_CONFIRMATION
            else:
                session.state = ConversationState.AWAITING_INPUT
            
            return {
                "session_id": session.id,
                "state": session.state.value,
                "message": assistant_message,
                "pending_actions": [a.to_dict() for a in session.pending_actions]
            }
            
        except Exception as e:
            session.state = ConversationState.ERROR
            return {
                "session_id": session.id,
                "state": session.state.value,
                "error": str(e),
                "message": "I encountered an error processing your request. Please try again."
            }
    
    def _generate_mock_response(self, session: ConversationSession) -> Dict[str, Any]:
        """Generate a mock response when no LLM is configured."""
        last_user_message = ""
        for msg in reversed(session.messages):
            if msg.role == "user":
                last_user_message = msg.content.lower()
                break
        
        # Generate a contextual mock response
        if any(word in last_user_message for word in ['create', 'make', 'build', 'generate']):
            response = (
                "I understand you want me to create something. Based on your request, "
                "here's what I propose to do:\n\n"
                "**Proposed Action:**\n"
                f"- I will create the content/item based on: '{last_user_message}'\n\n"
                "Is this what you want? Please confirm or let me know if you'd like any changes."
            )
            # Add a proposed action
            session.add_pending_action(
                ActionType.CREATE,
                f"Create based on: {last_user_message}",
                {"user_request": last_user_message}
            )
        elif any(word in last_user_message for word in ['search', 'find', 'look']):
            response = (
                "I'll search for the information you need using our vector database. "
                "This will find the most relevant results based on semantic similarity.\n\n"
                "Should I proceed with the search?"
            )
            session.add_pending_action(
                ActionType.QUERY,
                f"Search for: {last_user_message}",
                {"query": last_user_message}
            )
        elif any(word in last_user_message for word in ['workflow', 'automate', 'n8n']):
            response = (
                "I can set up a workflow automation for you using n8n. "
                "Here's what the workflow would do:\n\n"
                f"**Workflow Description:** Based on '{last_user_message}'\n\n"
                "Would you like me to create this workflow?"
            )
            session.add_pending_action(
                ActionType.WORKFLOW,
                f"Create workflow: {last_user_message}",
                {"workflow_request": last_user_message}
            )
        else:
            response = (
                f"I heard you! You said: '{last_user_message}'\n\n"
                "How can I help you today? I can:\n"
                "- Create documents, code, or content\n"
                "- Search through your data using AI-powered semantic search\n"
                "- Set up automated workflows\n"
                "- Process images, audio, and video\n"
                "- Interact via voice\n\n"
                "Just tell me what you'd like to do!"
            )
        
        session.add_message("assistant", response)
        session.state = (ConversationState.AWAITING_CONFIRMATION 
                        if session.pending_actions else ConversationState.AWAITING_INPUT)
        
        return {
            "session_id": session.id,
            "state": session.state.value,
            "message": response,
            "pending_actions": [a.to_dict() for a in session.pending_actions]
        }
    
    def _analyze_for_action(self, response: str, session: ConversationSession) -> bool:
        """Analyze the response to see if it proposes an action."""
        response_lower = response.lower()
        
        # Check for action keywords
        action_indicators = [
            'i will create', 'i\'ll create', 'i can create',
            'let me create', 'i\'ll set up', 'i will set up',
            'i can generate', 'i\'ll generate', 'let me generate',
            'proposed action', 'here\'s what i\'ll do',
            'is this what you want', 'would you like me to',
            'should i proceed', 'do you want me to'
        ]
        
        if any(indicator in response_lower for indicator in action_indicators):
            # Try to infer the action type
            if any(word in response_lower for word in ['create', 'generate', 'build', 'make']):
                action_type = ActionType.CREATE
            elif any(word in response_lower for word in ['modify', 'update', 'change', 'edit']):
                action_type = ActionType.MODIFY
            elif any(word in response_lower for word in ['delete', 'remove']):
                action_type = ActionType.DELETE
            elif any(word in response_lower for word in ['search', 'find', 'query', 'look']):
                action_type = ActionType.QUERY
            elif any(word in response_lower for word in ['workflow', 'automate', 'n8n']):
                action_type = ActionType.WORKFLOW
            else:
                action_type = ActionType.CREATE
            
            session.add_pending_action(
                action_type,
                "Proposed action from AI response",
                {"ai_response": response[:500]}
            )
            return True
        
        return False
    
    async def execute_confirmed_actions(self, session_id: str) -> List[Dict[str, Any]]:
        """Execute all confirmed actions in a session."""
        session = self.get_session(session_id)
        if not session:
            return [{"error": "Session not found"}]
        
        results = []
        for action in session.pending_actions[:]:
            if action.confirmed and not action.executed:
                handler = self.action_handlers.get(action.action_type)
                if handler:
                    try:
                        result = await handler(action)
                        action.result = result
                        action.executed = True
                        results.append({
                            "action_id": action.id,
                            "status": "success",
                            "result": result
                        })
                    except Exception as e:
                        results.append({
                            "action_id": action.id,
                            "status": "error",
                            "error": str(e)
                        })
                else:
                    action.executed = True
                    action.result = {"message": "Action acknowledged but no handler registered"}
                    results.append({
                        "action_id": action.id,
                        "status": "no_handler",
                        "message": f"No handler for action type: {action.action_type.value}"
                    })
                
                session.pending_actions.remove(action)
        
        session.state = ConversationState.COMPLETED if not session.pending_actions else ConversationState.AWAITING_INPUT
        
        return results
    
    def get_conversation_history(self, session_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get the conversation history for a session."""
        session = self.get_session(session_id)
        if session:
            return [m.to_dict() for m in session.messages]
        return None
