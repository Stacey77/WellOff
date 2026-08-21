"""
Tests for the Multimodal RAG module
"""
import pytest
import asyncio

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from multimodal_rag.rag_engine import (
    MultimodalRAG,
    ContentModality,
    ProcessedContent,
    RAGResult,
    TextProcessor,
    ImageProcessor,
    AudioProcessor,
    VideoProcessor
)


class TestTextProcessor:
    """Tests for the TextProcessor class."""
    
    def test_process_short_text(self):
        """Test processing short text."""
        processor = TextProcessor(chunk_size=100, chunk_overlap=20)
        
        result = processor.process("Hello, world!")
        
        assert len(result) == 1
        assert result[0]["text"] == "Hello, world!"
    
    def test_process_long_text(self):
        """Test processing long text into chunks."""
        processor = TextProcessor(chunk_size=100, chunk_overlap=20)
        
        long_text = "This is a test. " * 50
        result = processor.process(long_text)
        
        assert len(result) > 1
        # Check all chunks have text
        for chunk in result:
            assert len(chunk["text"]) > 0
    
    def test_chunk_metadata(self):
        """Test that chunks include metadata."""
        processor = TextProcessor(chunk_size=100)
        
        result = processor.process("Test text", metadata={"source": "test"})
        
        assert result[0]["metadata"]["source"] == "test"
        assert "chunk_id" in result[0]["metadata"]


class TestImageProcessor:
    """Tests for the ImageProcessor class."""
    
    def test_process_image_bytes(self):
        """Test processing image bytes."""
        processor = ImageProcessor()
        
        # Mock image data
        result = processor.process(b"fake_image_data", {"filename": "test.jpg"})
        
        assert result["modality"] == "image"
        assert "description" in result
    
    def test_process_image_base64(self):
        """Test processing base64 image."""
        processor = ImageProcessor()
        
        result = processor.process("base64_encoded_image")
        
        assert result["modality"] == "image"


class TestAudioProcessor:
    """Tests for the AudioProcessor class."""
    
    def test_process_audio(self):
        """Test processing audio."""
        processor = AudioProcessor()
        
        result = processor.process(b"fake_audio_data", {"duration": 10.5})
        
        assert result["modality"] == "audio"
        assert "transcription" in result
        assert result["duration_seconds"] == 10.5


class TestVideoProcessor:
    """Tests for the VideoProcessor class."""
    
    def test_process_video(self):
        """Test processing video."""
        processor = VideoProcessor()
        
        result = processor.process(b"fake_video_data")
        
        assert result["modality"] == "video"
        assert "frame_descriptions" in result
        assert "audio_transcription" in result
        assert "combined_text" in result


class TestMultimodalRAG:
    """Tests for the MultimodalRAG class."""
    
    def test_initialization(self):
        """Test RAG initialization."""
        rag = MultimodalRAG()
        
        assert rag.text_processor is not None
        assert rag.image_processor is not None
        assert rag.audio_processor is not None
        assert rag.video_processor is not None
    
    @pytest.mark.asyncio
    async def test_ingest_text_content(self):
        """Test ingesting text content."""
        rag = MultimodalRAG()
        
        result = await rag.ingest_content(
            content="This is test content for RAG",
            modality=ContentModality.TEXT,
            metadata={"source": "test"}
        )
        
        assert result is not None
        assert result.modality == ContentModality.TEXT
        assert len(result.embedding) == 1536
    
    @pytest.mark.asyncio
    async def test_ingest_image_content(self):
        """Test ingesting image content."""
        rag = MultimodalRAG()
        
        result = await rag.ingest_content(
            content=b"fake_image_data",
            modality=ContentModality.IMAGE
        )
        
        assert result is not None
        assert result.modality == ContentModality.IMAGE
    
    @pytest.mark.asyncio
    async def test_query_empty_store(self):
        """Test querying an empty store."""
        rag = MultimodalRAG()
        
        result = await rag.query("What is AI?")
        
        assert result is not None
        assert isinstance(result, RAGResult)
        assert result.query == "What is AI?"
    
    @pytest.mark.asyncio
    async def test_query_with_content(self):
        """Test querying after ingesting content."""
        rag = MultimodalRAG()
        
        # Ingest some content
        await rag.ingest_content(
            content="Artificial Intelligence is the simulation of human intelligence.",
            modality=ContentModality.TEXT
        )
        
        result = await rag.query("What is AI?")
        
        assert result is not None
        assert len(result.retrieved_contexts) > 0
    
    @pytest.mark.asyncio
    async def test_query_with_modality_filter(self):
        """Test querying with modality filter."""
        rag = MultimodalRAG()
        
        # Ingest different modalities
        await rag.ingest_content("Text content", ContentModality.TEXT)
        await rag.ingest_content(b"image_data", ContentModality.IMAGE)
        
        # Query only text
        result = await rag.query("test", filter_modality=ContentModality.TEXT)
        
        for context in result.retrieved_contexts:
            assert context.modality == ContentModality.TEXT
    
    def test_get_stats(self):
        """Test getting RAG statistics."""
        rag = MultimodalRAG()
        
        stats = rag.get_stats()
        
        assert "total_documents" in stats
        assert "modality_breakdown" in stats
        assert "embedding_model" in stats


class TestProcessedContent:
    """Tests for the ProcessedContent dataclass."""
    
    def test_to_dict(self):
        """Test converting to dict."""
        from datetime import datetime
        
        content = ProcessedContent(
            id="test-id",
            modality=ContentModality.TEXT,
            original_content="Original",
            text_representation="Processed text",
            embedding=[0.1] * 10,
            metadata={"key": "value"},
            created_at=datetime.utcnow()
        )
        
        result = content.to_dict()
        
        assert result["id"] == "test-id"
        assert result["modality"] == "text"
        assert "text_representation" in result


class TestRAGResult:
    """Tests for the RAGResult dataclass."""
    
    def test_to_dict(self):
        """Test converting to dict."""
        result = RAGResult(
            query="Test query",
            retrieved_contexts=[],
            generated_response="Test response",
            confidence_score=0.85,
            sources=[{"id": "1", "excerpt": "test"}]
        )
        
        result_dict = result.to_dict()
        
        assert result_dict["query"] == "Test query"
        assert result_dict["response"] == "Test response"
        assert result_dict["confidence"] == 0.85
