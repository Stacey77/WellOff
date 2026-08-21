"""
Multimodal RAG (Retrieval-Augmented Generation) Module

This module provides multimodal RAG capabilities supporting:
- Text documents
- Images (with visual understanding)
- Audio (with transcription)
- Video (with frame extraction and transcription)
"""

from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import uuid
import base64
import io


class ContentModality(Enum):
    """Supported content modalities."""
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    MIXED = "mixed"


@dataclass
class ProcessedContent:
    """Represents processed content from any modality."""
    id: str
    modality: ContentModality
    original_content: Any  # Could be text, bytes, path, etc.
    text_representation: str  # Extracted/generated text
    embedding: List[float]
    metadata: Dict[str, Any]
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "modality": self.modality.value,
            "text_representation": self.text_representation[:500] if self.text_representation else "",
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat()
        }


@dataclass
class RAGResult:
    """Represents a RAG query result."""
    query: str
    retrieved_contexts: List[ProcessedContent]
    generated_response: str
    confidence_score: float
    sources: List[Dict[str, Any]]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "contexts_count": len(self.retrieved_contexts),
            "response": self.generated_response,
            "confidence": self.confidence_score,
            "sources": self.sources
        }


class TextProcessor:
    """Process text content for RAG."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def process(self, text: str, metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Process text into chunks for embedding.
        
        Args:
            text: The text to process
            metadata: Additional metadata
            
        Returns:
            List of text chunks with metadata
        """
        chunks = []
        start = 0
        chunk_id = 0
        
        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk_text.rfind('.')
                last_newline = chunk_text.rfind('\n')
                break_point = max(last_period, last_newline)
                if break_point > self.chunk_size // 2:
                    chunk_text = chunk_text[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append({
                "id": f"chunk_{chunk_id}",
                "text": chunk_text.strip(),
                "start_index": start,
                "end_index": end,
                "metadata": {
                    **(metadata or {}),
                    "chunk_id": chunk_id,
                    "total_length": len(text)
                }
            })
            
            chunk_id += 1
            start = end - self.chunk_overlap
            if start < 0:
                start = 0
        
        return chunks


class ImageProcessor:
    """Process image content for RAG."""
    
    def __init__(self):
        self._vision_available = False
        try:
            from PIL import Image
            self._vision_available = True
        except ImportError:
            pass
    
    def process(self, image_data: Union[bytes, str], 
               metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process an image for RAG.
        
        Args:
            image_data: Image bytes or base64 string
            metadata: Additional metadata
            
        Returns:
            Processed image information
        """
        # Generate a text description (in real implementation, use vision model)
        description = self._generate_description(image_data)
        
        image_info = {
            "modality": "image",
            "description": description,
            "has_image": True,
            "metadata": metadata or {}
        }
        
        if self._vision_available and isinstance(image_data, bytes):
            try:
                from PIL import Image
                img = Image.open(io.BytesIO(image_data))
                image_info["width"] = img.width
                image_info["height"] = img.height
                image_info["format"] = img.format
                image_info["mode"] = img.mode
            except Exception:
                pass
        
        return image_info
    
    def _generate_description(self, image_data: Union[bytes, str]) -> str:
        """Generate a text description of the image."""
        # In a real implementation, this would use a vision model like GPT-4V
        # For now, return a placeholder
        return "An image that has been processed for RAG retrieval. " \
               "Vision model integration would provide detailed description."


class AudioProcessor:
    """Process audio content for RAG."""
    
    def __init__(self):
        self._speech_recognition_available = False
    
    def process(self, audio_data: Union[bytes, str],
               metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process audio for RAG (transcription).
        
        Args:
            audio_data: Audio bytes or file path
            metadata: Additional metadata
            
        Returns:
            Processed audio information with transcription
        """
        # In a real implementation, use Whisper or similar for transcription
        transcription = self._transcribe(audio_data)
        
        return {
            "modality": "audio",
            "transcription": transcription,
            "duration_seconds": metadata.get("duration", 0) if metadata else 0,
            "metadata": metadata or {}
        }
    
    def _transcribe(self, audio_data: Union[bytes, str]) -> str:
        """Transcribe audio to text."""
        # In a real implementation, use Whisper API or local model
        return "Audio transcription would be generated here using speech-to-text. " \
               "This would integrate with OpenAI Whisper or similar service."


class VideoProcessor:
    """Process video content for RAG."""
    
    def __init__(self, frame_interval: int = 30):
        self.frame_interval = frame_interval  # Extract frame every N frames
        self._image_processor = ImageProcessor()
        self._audio_processor = AudioProcessor()
    
    def process(self, video_data: Union[bytes, str],
               metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process video for RAG (frame extraction and audio transcription).
        
        Args:
            video_data: Video bytes or file path
            metadata: Additional metadata
            
        Returns:
            Processed video information
        """
        # In a real implementation, extract frames and audio
        frame_descriptions = self._extract_frame_descriptions(video_data)
        audio_transcription = self._extract_audio_transcription(video_data)
        
        combined_text = f"Video content: {' '.join(frame_descriptions)}. " \
                       f"Audio: {audio_transcription}"
        
        return {
            "modality": "video",
            "frame_count": len(frame_descriptions),
            "frame_descriptions": frame_descriptions,
            "audio_transcription": audio_transcription,
            "combined_text": combined_text,
            "metadata": metadata or {}
        }
    
    def _extract_frame_descriptions(self, video_data: Union[bytes, str]) -> List[str]:
        """Extract and describe key frames from video."""
        # In a real implementation, use OpenCV + Vision model
        return [
            "Key frame 1: Scene description would be here",
            "Key frame 2: Scene description would be here"
        ]
    
    def _extract_audio_transcription(self, video_data: Union[bytes, str]) -> str:
        """Extract and transcribe audio from video."""
        # In a real implementation, extract audio track and use Whisper
        return "Video audio transcription would be generated here."


class MultimodalRAG:
    """
    Main multimodal RAG system that combines all modality processors
    with vector search and generation capabilities.
    """
    
    def __init__(self, milvus_client=None, embedding_model: str = "text-embedding-ada-002",
                 llm_client=None):
        """
        Initialize the multimodal RAG system.
        
        Args:
            milvus_client: MilvusClient instance for vector storage
            embedding_model: Name of the embedding model to use
            llm_client: LLM client for generation (e.g., OpenAI)
        """
        self.milvus_client = milvus_client
        self.embedding_model = embedding_model
        self.llm_client = llm_client
        
        # Initialize processors
        self.text_processor = TextProcessor()
        self.image_processor = ImageProcessor()
        self.audio_processor = AudioProcessor()
        self.video_processor = VideoProcessor()
        
        # Local storage for processed content
        self._content_store: Dict[str, ProcessedContent] = {}
    
    async def ingest_content(self, content: Any, modality: ContentModality,
                           metadata: Dict[str, Any] = None) -> ProcessedContent:
        """
        Ingest content of any supported modality.
        
        Args:
            content: The content to ingest
            modality: Type of content
            metadata: Additional metadata
            
        Returns:
            Processed content ready for RAG
        """
        # Process based on modality
        if modality == ContentModality.TEXT:
            chunks = self.text_processor.process(content, metadata)
            text_repr = content
        elif modality == ContentModality.IMAGE:
            processed = self.image_processor.process(content, metadata)
            text_repr = processed["description"]
            metadata = {**(metadata or {}), **processed}
        elif modality == ContentModality.AUDIO:
            processed = self.audio_processor.process(content, metadata)
            text_repr = processed["transcription"]
            metadata = {**(metadata or {}), **processed}
        elif modality == ContentModality.VIDEO:
            processed = self.video_processor.process(content, metadata)
            text_repr = processed["combined_text"]
            metadata = {**(metadata or {}), **processed}
        else:
            text_repr = str(content)
        
        # Generate embedding
        embedding = await self._generate_embedding(text_repr)
        
        # Create processed content
        processed_content = ProcessedContent(
            id=str(uuid.uuid4()),
            modality=modality,
            original_content=content if modality == ContentModality.TEXT else "binary_data",
            text_representation=text_repr,
            embedding=embedding,
            metadata=metadata or {},
            created_at=datetime.utcnow()
        )
        
        # Store in vector database
        if self.milvus_client:
            await self.milvus_client.insert_document(
                content=text_repr,
                embedding=embedding,
                metadata=metadata or {},
                modality=modality.value
            )
        
        self._content_store[processed_content.id] = processed_content
        
        return processed_content
    
    async def query(self, query: str, top_k: int = 5,
                   filter_modality: Optional[ContentModality] = None) -> RAGResult:
        """
        Query the RAG system with a natural language question.
        
        Args:
            query: The question or search query
            top_k: Number of relevant contexts to retrieve
            filter_modality: Optional filter by content type
            
        Returns:
            RAGResult with retrieved contexts and generated answer
        """
        # Generate query embedding
        query_embedding = await self._generate_embedding(query)
        
        # Search for relevant contexts
        contexts = []
        sources = []
        
        if self.milvus_client:
            search_results = await self.milvus_client.search(
                query_embedding=query_embedding,
                top_k=top_k,
                filter_modality=filter_modality.value if filter_modality else None
            )
            
            for result in search_results:
                # Find or create ProcessedContent from search result
                content = ProcessedContent(
                    id=result.document.id,
                    modality=ContentModality(result.document.modality),
                    original_content="",
                    text_representation=result.document.content,
                    embedding=[],
                    metadata=result.document.metadata,
                    created_at=result.document.created_at
                )
                contexts.append(content)
                sources.append({
                    "id": result.document.id,
                    "modality": result.document.modality,
                    "score": result.score,
                    "excerpt": result.document.content[:200] if result.document.content else ""
                })
        else:
            # Search local store
            for content in self._content_store.values():
                if filter_modality and content.modality != filter_modality:
                    continue
                contexts.append(content)
                sources.append({
                    "id": content.id,
                    "modality": content.modality.value,
                    "excerpt": content.text_representation[:200] if content.text_representation else ""
                })
                if len(contexts) >= top_k:
                    break
        
        # Generate response using LLM
        response = await self._generate_response(query, contexts)
        
        # Calculate confidence based on context relevance
        confidence = min(1.0, len(contexts) / top_k) if top_k > 0 else 0.0
        
        return RAGResult(
            query=query,
            retrieved_contexts=contexts,
            generated_response=response,
            confidence_score=confidence,
            sources=sources
        )
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text."""
        if self.llm_client:
            try:
                response = await self.llm_client.embeddings.create(
                    model=self.embedding_model,
                    input=text
                )
                return response.data[0].embedding
            except Exception:
                pass
        
        # Return mock embedding (1536 dimensions for compatibility)
        import hashlib
        # Create deterministic but varied mock embedding based on text
        hash_bytes = hashlib.sha256(text.encode()).digest()
        embedding = []
        for i in range(1536):
            byte_val = hash_bytes[i % len(hash_bytes)]
            embedding.append((byte_val / 255.0) * 2 - 1)  # Normalize to [-1, 1]
        return embedding
    
    async def _generate_response(self, query: str, 
                                contexts: List[ProcessedContent]) -> str:
        """Generate a response using the LLM and retrieved contexts."""
        # Build context string
        context_text = "\n\n".join([
            f"[{c.modality.value.upper()}] {c.text_representation[:1000]}"
            for c in contexts
        ])
        
        prompt = f"""Based on the following context, answer the question.

Context:
{context_text}

Question: {query}

Answer:"""
        
        if self.llm_client:
            try:
                response = await self.llm_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that answers questions based on the provided context."},
                        {"role": "user", "content": prompt}
                    ]
                )
                return response.choices[0].message.content
            except Exception:
                pass
        
        # Mock response
        if contexts:
            return f"Based on the {len(contexts)} relevant context(s) found, " \
                   f"here is the information related to your query '{query}': " \
                   f"The retrieved content includes {', '.join([c.modality.value for c in contexts])} data."
        else:
            return f"I couldn't find specific information about '{query}' in the knowledge base. " \
                   "Please try rephrasing your question or ingest relevant content first."
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the RAG system."""
        modality_counts = {}
        for content in self._content_store.values():
            mod = content.modality.value
            modality_counts[mod] = modality_counts.get(mod, 0) + 1
        
        return {
            "total_documents": len(self._content_store),
            "modality_breakdown": modality_counts,
            "embedding_model": self.embedding_model,
            "has_milvus": self.milvus_client is not None,
            "has_llm": self.llm_client is not None
        }
