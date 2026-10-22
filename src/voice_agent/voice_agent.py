"""
AI Voice Agent Module

This module provides voice interaction capabilities including:
- Speech-to-Text (STT) for voice input
- Text-to-Speech (TTS) for voice output
- Real-time voice conversation
- Voice command processing
"""

from typing import Dict, Any, Optional, List, Callable, Awaitable
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import uuid
import asyncio
import base64
import io


class VoiceState(Enum):
    """States of the voice agent."""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"


class VoiceEventType(Enum):
    """Types of voice events."""
    LISTENING_STARTED = "listening_started"
    LISTENING_STOPPED = "listening_stopped"
    TRANSCRIPTION_COMPLETE = "transcription_complete"
    RESPONSE_READY = "response_ready"
    SPEAKING_STARTED = "speaking_started"
    SPEAKING_COMPLETE = "speaking_complete"
    ERROR = "error"


@dataclass
class VoiceEvent:
    """Represents a voice event."""
    id: str
    event_type: VoiceEventType
    timestamp: datetime
    data: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data
        }


@dataclass
class VoiceSession:
    """Represents a voice interaction session."""
    id: str
    state: VoiceState
    events: List[VoiceEvent]
    transcriptions: List[str]
    responses: List[str]
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]
    
    def add_event(self, event_type: VoiceEventType, data: Dict[str, Any]) -> VoiceEvent:
        """Add an event to the session."""
        event = VoiceEvent(
            id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=datetime.utcnow(),
            data=data
        )
        self.events.append(event)
        self.updated_at = datetime.utcnow()
        return event
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "state": self.state.value,
            "events_count": len(self.events),
            "transcriptions": self.transcriptions,
            "responses": self.responses,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "metadata": self.metadata
        }


class SpeechToText:
    """
    Speech-to-Text processor for converting voice input to text.
    """
    
    def __init__(self, language: str = "en-US", model: str = "whisper"):
        """
        Initialize STT processor.
        
        Args:
            language: Language code for recognition
            model: STT model to use
        """
        self.language = language
        self.model = model
        self._recognizer = None
        
        try:
            import speech_recognition as sr
            self._recognizer = sr.Recognizer()
        except ImportError:
            pass
    
    async def transcribe_audio(self, audio_data: bytes, 
                              format: str = "wav") -> Dict[str, Any]:
        """
        Transcribe audio data to text.
        
        Args:
            audio_data: Raw audio bytes
            format: Audio format (wav, mp3, etc.)
            
        Returns:
            Transcription result
        """
        # In a real implementation, this would use OpenAI Whisper API
        # or local speech recognition
        
        result = {
            "transcription": "",
            "confidence": 0.0,
            "language": self.language,
            "duration_seconds": 0.0,
            "words": []
        }
        
        if self._recognizer:
            try:
                import speech_recognition as sr
                audio_io = io.BytesIO(audio_data)
                with sr.AudioFile(audio_io) as source:
                    audio = self._recognizer.record(source)
                    text = self._recognizer.recognize_google(audio, language=self.language)
                    result["transcription"] = text
                    result["confidence"] = 0.9
                    return result
            except Exception as e:
                result["error"] = str(e)
        
        # Mock transcription for demo
        result["transcription"] = "This is a mock transcription of the audio input."
        result["confidence"] = 0.85
        result["duration_seconds"] = len(audio_data) / 16000  # Assuming 16kHz
        
        return result
    
    async def transcribe_stream(self, audio_chunks: List[bytes]) -> str:
        """
        Transcribe streaming audio chunks.
        
        Args:
            audio_chunks: List of audio chunk bytes
            
        Returns:
            Full transcription
        """
        # Combine chunks and transcribe
        full_audio = b''.join(audio_chunks)
        result = await self.transcribe_audio(full_audio)
        return result.get("transcription", "")


class TextToSpeech:
    """
    Text-to-Speech processor for converting text to audio.
    """
    
    def __init__(self, voice: str = "default", rate: int = 150, volume: float = 1.0):
        """
        Initialize TTS processor.
        
        Args:
            voice: Voice to use for synthesis
            rate: Speech rate (words per minute)
            volume: Volume level (0.0 to 1.0)
        """
        self.voice = voice
        self.rate = rate
        self.volume = volume
        self._engine = None
        
        try:
            import pyttsx3
            self._engine = pyttsx3.init()
            self._engine.setProperty('rate', rate)
            self._engine.setProperty('volume', volume)
        except Exception:
            pass
    
    async def synthesize(self, text: str, output_format: str = "wav") -> Dict[str, Any]:
        """
        Synthesize speech from text.
        
        Args:
            text: Text to synthesize
            output_format: Output audio format
            
        Returns:
            Synthesis result with audio data
        """
        result = {
            "text": text,
            "audio_data": None,
            "format": output_format,
            "duration_seconds": len(text) / 15,  # Rough estimate
            "voice": self.voice
        }
        
        # In a real implementation, use OpenAI TTS API or pyttsx3
        # For now, return mock audio data
        result["audio_data"] = base64.b64encode(b"mock_audio_data").decode('utf-8')
        result["message"] = "Audio synthesized (mock mode)"
        
        return result
    
    def speak_sync(self, text: str):
        """Speak text synchronously (blocking)."""
        if self._engine:
            self._engine.say(text)
            self._engine.runAndWait()
    
    def set_voice(self, voice_id: str):
        """Set the voice to use."""
        if self._engine:
            voices = self._engine.getProperty('voices')
            for v in voices:
                if voice_id in v.id:
                    self._engine.setProperty('voice', v.id)
                    break
    
    def get_available_voices(self) -> List[Dict[str, str]]:
        """Get list of available voices."""
        if self._engine:
            try:
                voices = self._engine.getProperty('voices')
                return [{"id": v.id, "name": v.name} for v in voices]
            except Exception:
                pass
        return [{"id": "default", "name": "Default Voice"}]


class VoiceAgent:
    """
    Main Voice Agent that orchestrates voice interactions.
    
    Provides:
    - Voice session management
    - Real-time voice conversation
    - Integration with conversational AI
    - Voice command processing
    """
    
    def __init__(self, conversational_ai=None, language: str = "en-US",
                 voice: str = "default"):
        """
        Initialize the Voice Agent.
        
        Args:
            conversational_ai: ConversationalAI instance for processing
            language: Language for speech recognition
            voice: Voice for speech synthesis
        """
        self.conversational_ai = conversational_ai
        self.language = language
        self.voice = voice
        
        self.stt = SpeechToText(language=language)
        self.tts = TextToSpeech(voice=voice)
        
        self._sessions: Dict[str, VoiceSession] = {}
        self._event_handlers: Dict[VoiceEventType, List[Callable]] = {}
        
        # Wake word detection (simplified)
        self.wake_words = ["hey welloff", "welloff", "hey assistant"]
        self._is_active = False
    
    def create_session(self, metadata: Dict[str, Any] = None) -> VoiceSession:
        """Create a new voice session."""
        session = VoiceSession(
            id=str(uuid.uuid4()),
            state=VoiceState.IDLE,
            events=[],
            transcriptions=[],
            responses=[],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            metadata=metadata or {}
        )
        
        self._sessions[session.id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[VoiceSession]:
        """Get an existing voice session."""
        return self._sessions.get(session_id)
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a voice session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False
    
    def register_event_handler(self, event_type: VoiceEventType,
                              handler: Callable[[VoiceEvent], Awaitable[None]]):
        """Register a handler for a voice event type."""
        if event_type not in self._event_handlers:
            self._event_handlers[event_type] = []
        self._event_handlers[event_type].append(handler)
    
    async def _emit_event(self, session: VoiceSession, event_type: VoiceEventType,
                         data: Dict[str, Any]):
        """Emit a voice event."""
        event = session.add_event(event_type, data)
        
        handlers = self._event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                print(f"Event handler error: {e}")
        
        return event
    
    async def start_listening(self, session_id: str) -> Dict[str, Any]:
        """
        Start listening for voice input.
        
        Args:
            session_id: Session ID
            
        Returns:
            Status of listening start
        """
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found", "session_id": session_id}
        
        session.state = VoiceState.LISTENING
        await self._emit_event(session, VoiceEventType.LISTENING_STARTED, {})
        
        return {
            "session_id": session_id,
            "state": session.state.value,
            "message": "Listening for voice input..."
        }
    
    async def stop_listening(self, session_id: str) -> Dict[str, Any]:
        """
        Stop listening for voice input.
        
        Args:
            session_id: Session ID
            
        Returns:
            Status of listening stop
        """
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found", "session_id": session_id}
        
        session.state = VoiceState.PROCESSING
        await self._emit_event(session, VoiceEventType.LISTENING_STOPPED, {})
        
        return {
            "session_id": session_id,
            "state": session.state.value,
            "message": "Stopped listening"
        }
    
    async def process_audio(self, session_id: str, audio_data: bytes) -> Dict[str, Any]:
        """
        Process audio input and generate a response.
        
        Args:
            session_id: Session ID
            audio_data: Raw audio bytes
            
        Returns:
            Processing result with transcription and response
        """
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found", "session_id": session_id}
        
        session.state = VoiceState.PROCESSING
        
        # Transcribe audio
        transcription_result = await self.stt.transcribe_audio(audio_data)
        transcription = transcription_result.get("transcription", "")
        session.transcriptions.append(transcription)
        
        await self._emit_event(session, VoiceEventType.TRANSCRIPTION_COMPLETE, {
            "transcription": transcription,
            "confidence": transcription_result.get("confidence", 0)
        })
        
        # Check for wake word if not active
        if not self._is_active:
            for wake_word in self.wake_words:
                if wake_word in transcription.lower():
                    self._is_active = True
                    transcription = transcription.lower().replace(wake_word, "").strip()
                    break
        
        # Process with conversational AI
        response_text = await self._get_ai_response(session, transcription)
        session.responses.append(response_text)
        
        await self._emit_event(session, VoiceEventType.RESPONSE_READY, {
            "response": response_text
        })
        
        # Synthesize response
        audio_response = await self.tts.synthesize(response_text)
        
        session.state = VoiceState.SPEAKING
        await self._emit_event(session, VoiceEventType.SPEAKING_STARTED, {})
        
        # Mark as complete
        session.state = VoiceState.IDLE
        await self._emit_event(session, VoiceEventType.SPEAKING_COMPLETE, {})
        
        return {
            "session_id": session_id,
            "state": session.state.value,
            "transcription": transcription,
            "response": response_text,
            "audio_response": audio_response.get("audio_data"),
            "confidence": transcription_result.get("confidence", 0)
        }
    
    async def _get_ai_response(self, session: VoiceSession, text: str) -> str:
        """Get response from conversational AI."""
        if self.conversational_ai:
            # Find or create conversation session
            conv_session_id = session.metadata.get("conversation_session_id")
            if not conv_session_id:
                conv_session = self.conversational_ai.create_session()
                session.metadata["conversation_session_id"] = conv_session.id
                conv_session_id = conv_session.id
            
            result = await self.conversational_ai.process_message(conv_session_id, text)
            return result.get("message", "I'm sorry, I couldn't understand that.")
        
        # Mock response
        return f"I heard you say: '{text}'. How can I help you with that?"
    
    async def process_text(self, session_id: str, text: str) -> Dict[str, Any]:
        """
        Process text input and generate voice response.
        
        Args:
            session_id: Session ID
            text: Text input
            
        Returns:
            Processing result with response
        """
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found", "session_id": session_id}
        
        session.transcriptions.append(text)
        
        # Get AI response
        response_text = await self._get_ai_response(session, text)
        session.responses.append(response_text)
        
        # Synthesize response
        audio_response = await self.tts.synthesize(response_text)
        
        return {
            "session_id": session_id,
            "input": text,
            "response": response_text,
            "audio_response": audio_response.get("audio_data")
        }
    
    async def execute_voice_command(self, session_id: str, 
                                   command: str) -> Dict[str, Any]:
        """
        Execute a voice command.
        
        Args:
            session_id: Session ID
            command: Voice command to execute
            
        Returns:
            Command execution result
        """
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found", "session_id": session_id}
        
        # Parse and execute command
        command_lower = command.lower()
        
        # Built-in commands
        if "stop" in command_lower or "cancel" in command_lower:
            self._is_active = False
            return {
                "command": command,
                "action": "deactivated",
                "message": "Voice agent deactivated"
            }
        
        elif "help" in command_lower:
            help_text = """I can help you with:
            - Creating documents and content
            - Searching through your data
            - Setting up automated workflows
            - Processing images, audio, and video
            Just tell me what you'd like to do!"""
            audio = await self.tts.synthesize(help_text)
            return {
                "command": command,
                "action": "help",
                "message": help_text,
                "audio": audio.get("audio_data")
            }
        
        # Pass to conversational AI for processing
        return await self.process_text(session_id, command)
    
    def get_available_commands(self) -> List[Dict[str, str]]:
        """Get list of available voice commands."""
        return [
            {"command": "stop/cancel", "description": "Deactivate voice agent"},
            {"command": "help", "description": "Get help with available features"},
            {"command": "create [something]", "description": "Create content"},
            {"command": "search [query]", "description": "Search the knowledge base"},
            {"command": "workflow [action]", "description": "Trigger a workflow"},
        ]
    
    def get_session_stats(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get statistics for a voice session."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        return {
            "session_id": session_id,
            "state": session.state.value,
            "total_interactions": len(session.transcriptions),
            "events_count": len(session.events),
            "duration_seconds": (session.updated_at - session.created_at).total_seconds()
        }
