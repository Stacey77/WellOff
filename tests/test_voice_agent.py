"""
Tests for the Voice Agent module
"""
import pytest
import asyncio

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from voice_agent.voice_agent import (
    VoiceAgent,
    VoiceSession,
    VoiceState,
    VoiceEvent,
    VoiceEventType,
    SpeechToText,
    TextToSpeech
)


class TestSpeechToText:
    """Tests for the SpeechToText class."""
    
    def test_initialization(self):
        """Test STT initialization."""
        stt = SpeechToText(language="en-US", model="whisper")
        
        assert stt.language == "en-US"
        assert stt.model == "whisper"
    
    @pytest.mark.asyncio
    async def test_transcribe_audio(self):
        """Test transcribing audio."""
        stt = SpeechToText()
        
        result = await stt.transcribe_audio(b"fake_audio_data")
        
        assert "transcription" in result
        assert "confidence" in result
        assert "language" in result
    
    @pytest.mark.asyncio
    async def test_transcribe_stream(self):
        """Test transcribing streaming audio."""
        stt = SpeechToText()
        
        chunks = [b"chunk1", b"chunk2", b"chunk3"]
        result = await stt.transcribe_stream(chunks)
        
        assert isinstance(result, str)


class TestTextToSpeech:
    """Tests for the TextToSpeech class."""
    
    def test_initialization(self):
        """Test TTS initialization."""
        tts = TextToSpeech(voice="default", rate=150, volume=0.8)
        
        assert tts.voice == "default"
        assert tts.rate == 150
        assert tts.volume == 0.8
    
    @pytest.mark.asyncio
    async def test_synthesize(self):
        """Test synthesizing speech."""
        tts = TextToSpeech()
        
        result = await tts.synthesize("Hello, world!")
        
        assert "text" in result
        assert result["text"] == "Hello, world!"
        assert "audio_data" in result
        assert "format" in result
    
    def test_get_available_voices(self):
        """Test getting available voices."""
        tts = TextToSpeech()
        
        voices = tts.get_available_voices()
        
        assert isinstance(voices, list)
        assert len(voices) > 0


class TestVoiceSession:
    """Tests for the VoiceSession class."""
    
    def test_add_event(self):
        """Test adding an event to session."""
        from datetime import datetime
        
        session = VoiceSession(
            id="session-1",
            state=VoiceState.IDLE,
            events=[],
            transcriptions=[],
            responses=[],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            metadata={}
        )
        
        event = session.add_event(
            VoiceEventType.LISTENING_STARTED,
            {"key": "value"}
        )
        
        assert len(session.events) == 1
        assert event.event_type == VoiceEventType.LISTENING_STARTED
    
    def test_to_dict(self):
        """Test converting session to dict."""
        from datetime import datetime
        
        session = VoiceSession(
            id="session-1",
            state=VoiceState.IDLE,
            events=[],
            transcriptions=["Hello"],
            responses=["Hi there!"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            metadata={"key": "value"}
        )
        
        result = session.to_dict()
        
        assert result["id"] == "session-1"
        assert result["state"] == "idle"
        assert result["transcriptions"] == ["Hello"]


class TestVoiceAgent:
    """Tests for the VoiceAgent class."""
    
    def test_initialization(self):
        """Test voice agent initialization."""
        agent = VoiceAgent(language="en-US", voice="default")
        
        assert agent.language == "en-US"
        assert agent.voice == "default"
        assert agent.stt is not None
        assert agent.tts is not None
    
    def test_create_session(self):
        """Test creating a voice session."""
        agent = VoiceAgent()
        
        session = agent.create_session(metadata={"user": "test"})
        
        assert session is not None
        assert session.id in agent._sessions
        assert session.state == VoiceState.IDLE
    
    def test_get_session(self):
        """Test getting an existing session."""
        agent = VoiceAgent()
        session = agent.create_session()
        
        retrieved = agent.get_session(session.id)
        
        assert retrieved is not None
        assert retrieved.id == session.id
    
    def test_delete_session(self):
        """Test deleting a session."""
        agent = VoiceAgent()
        session = agent.create_session()
        
        result = agent.delete_session(session.id)
        
        assert result is True
        assert agent.get_session(session.id) is None
    
    @pytest.mark.asyncio
    async def test_start_listening(self):
        """Test starting to listen."""
        agent = VoiceAgent()
        session = agent.create_session()
        
        result = await agent.start_listening(session.id)
        
        assert result["state"] == "listening"
        assert session.state == VoiceState.LISTENING
    
    @pytest.mark.asyncio
    async def test_stop_listening(self):
        """Test stopping listening."""
        agent = VoiceAgent()
        session = agent.create_session()
        await agent.start_listening(session.id)
        
        result = await agent.stop_listening(session.id)
        
        assert result["state"] == "processing"
    
    @pytest.mark.asyncio
    async def test_process_audio(self):
        """Test processing audio."""
        agent = VoiceAgent()
        session = agent.create_session()
        
        result = await agent.process_audio(session.id, b"fake_audio_data")
        
        assert "transcription" in result
        assert "response" in result
        assert len(session.transcriptions) > 0
    
    @pytest.mark.asyncio
    async def test_process_text(self):
        """Test processing text input."""
        agent = VoiceAgent()
        session = agent.create_session()
        
        result = await agent.process_text(session.id, "Hello, agent!")
        
        assert "input" in result
        assert "response" in result
        assert result["input"] == "Hello, agent!"
    
    @pytest.mark.asyncio
    async def test_execute_voice_command_stop(self):
        """Test executing stop command."""
        agent = VoiceAgent()
        agent._is_active = True
        session = agent.create_session()
        
        result = await agent.execute_voice_command(session.id, "stop")
        
        assert result["action"] == "deactivated"
        assert agent._is_active is False
    
    @pytest.mark.asyncio
    async def test_execute_voice_command_help(self):
        """Test executing help command."""
        agent = VoiceAgent()
        session = agent.create_session()
        
        result = await agent.execute_voice_command(session.id, "help")
        
        assert result["action"] == "help"
        assert "message" in result
    
    def test_get_available_commands(self):
        """Test getting available commands."""
        agent = VoiceAgent()
        
        commands = agent.get_available_commands()
        
        assert isinstance(commands, list)
        assert len(commands) > 0
    
    def test_get_session_stats(self):
        """Test getting session stats."""
        agent = VoiceAgent()
        session = agent.create_session()
        
        stats = agent.get_session_stats(session.id)
        
        assert stats is not None
        assert "session_id" in stats
        assert "total_interactions" in stats
    
    @pytest.mark.asyncio
    async def test_event_handler_registration(self):
        """Test registering event handlers."""
        agent = VoiceAgent()
        events_received = []
        
        async def handler(event):
            events_received.append(event)
        
        agent.register_event_handler(VoiceEventType.LISTENING_STARTED, handler)
        
        session = agent.create_session()
        await agent.start_listening(session.id)
        
        assert len(events_received) > 0
        assert events_received[0].event_type == VoiceEventType.LISTENING_STARTED
