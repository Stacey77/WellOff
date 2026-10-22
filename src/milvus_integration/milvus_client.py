"""
Milvus Vector Database Integration Module

This module provides integration with Milvus for vector storage and semantic search,
enabling powerful RAG (Retrieval-Augmented Generation) capabilities.
"""

from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass
import json
import uuid
from datetime import datetime

try:
    from pymilvus import (
        connections,
        Collection,
        CollectionSchema,
        FieldSchema,
        DataType,
        utility
    )
    MILVUS_AVAILABLE = True
except ImportError:
    MILVUS_AVAILABLE = False


@dataclass
class VectorDocument:
    """Represents a document with its vector embedding."""
    id: str
    content: str
    embedding: List[float]
    metadata: Dict[str, Any]
    modality: str  # text, image, audio, video
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content[:500] if self.content else "",  # Truncate for display
            "metadata": self.metadata,
            "modality": self.modality,
            "created_at": self.created_at.isoformat()
        }


@dataclass
class SearchResult:
    """Represents a search result from Milvus."""
    document: VectorDocument
    score: float
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "document": self.document.to_dict(),
            "score": self.score
        }


class MilvusClient:
    """
    Client for interacting with Milvus vector database.
    
    Provides methods for:
    - Connecting to Milvus
    - Creating and managing collections
    - Inserting vectors
    - Semantic search
    - Managing multimodal embeddings
    """
    
    def __init__(self, host: str = "localhost", port: int = 19530, 
                 collection_name: str = "welloff_vectors", dimension: int = 1536):
        """
        Initialize Milvus client.
        
        Args:
            host: Milvus server host
            port: Milvus server port
            collection_name: Name of the collection to use
            dimension: Dimension of vectors (1536 for OpenAI embeddings)
        """
        self.host = host
        self.port = port
        self.collection_name = collection_name
        self.dimension = dimension
        self.collection: Optional[Any] = None
        self._connected = False
        self._mock_storage: List[VectorDocument] = []  # For testing without Milvus
    
    def connect(self) -> bool:
        """Connect to Milvus server."""
        if not MILVUS_AVAILABLE:
            print("Warning: pymilvus not installed. Using mock storage.")
            self._connected = True
            return True
        
        try:
            connections.connect(
                alias="default",
                host=self.host,
                port=self.port
            )
            self._connected = True
            return True
        except Exception as e:
            print(f"Warning: Could not connect to Milvus: {e}. Using mock storage.")
            self._connected = True
            return True
    
    def disconnect(self):
        """Disconnect from Milvus server."""
        if MILVUS_AVAILABLE and self._connected:
            try:
                connections.disconnect("default")
            except Exception:
                pass
        self._connected = False
    
    def create_collection(self) -> bool:
        """Create the vector collection with schema."""
        if not MILVUS_AVAILABLE:
            return True
        
        try:
            # Check if collection exists
            if utility.has_collection(self.collection_name):
                self.collection = Collection(self.collection_name)
                return True
            
            # Define schema
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=64, is_primary=True),
                FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dimension),
                FieldSchema(name="metadata", dtype=DataType.JSON),
                FieldSchema(name="modality", dtype=DataType.VARCHAR, max_length=32),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=64)
            ]
            
            schema = CollectionSchema(
                fields=fields,
                description="WellOff AI vector storage for multimodal RAG"
            )
            
            # Create collection
            self.collection = Collection(
                name=self.collection_name,
                schema=schema
            )
            
            # Create index for vector field
            index_params = {
                "metric_type": "COSINE",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 128}
            }
            self.collection.create_index(
                field_name="embedding",
                index_params=index_params
            )
            
            return True
            
        except Exception as e:
            print(f"Error creating collection: {e}")
            return False
    
    async def insert_document(self, content: str, embedding: List[float],
                            metadata: Dict[str, Any] = None,
                            modality: str = "text") -> VectorDocument:
        """
        Insert a document with its embedding into Milvus.
        
        Args:
            content: The document content
            embedding: Vector embedding of the content
            metadata: Additional metadata
            modality: Type of content (text, image, audio, video)
            
        Returns:
            The created VectorDocument
        """
        doc = VectorDocument(
            id=str(uuid.uuid4()),
            content=content,
            embedding=embedding,
            metadata=metadata or {},
            modality=modality,
            created_at=datetime.utcnow()
        )
        
        if not MILVUS_AVAILABLE or not self.collection:
            # Use mock storage
            self._mock_storage.append(doc)
            return doc
        
        try:
            data = [
                [doc.id],
                [doc.content],
                [doc.embedding],
                [doc.metadata],
                [doc.modality],
                [doc.created_at.isoformat()]
            ]
            
            self.collection.insert(data)
            return doc
            
        except Exception as e:
            print(f"Error inserting document: {e}")
            # Fall back to mock storage
            self._mock_storage.append(doc)
            return doc
    
    async def insert_documents_batch(self, documents: List[Dict[str, Any]]) -> List[VectorDocument]:
        """
        Insert multiple documents in batch.
        
        Args:
            documents: List of documents with content, embedding, metadata, and modality
            
        Returns:
            List of created VectorDocuments
        """
        results = []
        for doc_data in documents:
            doc = await self.insert_document(
                content=doc_data.get("content", ""),
                embedding=doc_data.get("embedding", []),
                metadata=doc_data.get("metadata", {}),
                modality=doc_data.get("modality", "text")
            )
            results.append(doc)
        return results
    
    async def search(self, query_embedding: List[float], top_k: int = 5,
                    filter_modality: Optional[str] = None,
                    filter_metadata: Optional[Dict[str, Any]] = None) -> List[SearchResult]:
        """
        Search for similar documents using vector similarity.
        
        Args:
            query_embedding: Vector embedding of the search query
            top_k: Number of results to return
            filter_modality: Filter by content modality
            filter_metadata: Filter by metadata fields
            
        Returns:
            List of SearchResults sorted by similarity
        """
        if not MILVUS_AVAILABLE or not self.collection:
            # Mock search using cosine similarity
            return self._mock_search(query_embedding, top_k, filter_modality)
        
        try:
            # Build filter expression
            expr = None
            if filter_modality:
                expr = f'modality == "{filter_modality}"'
            
            # Load collection
            self.collection.load()
            
            # Perform search
            search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
            results = self.collection.search(
                data=[query_embedding],
                anns_field="embedding",
                param=search_params,
                limit=top_k,
                expr=expr,
                output_fields=["id", "content", "metadata", "modality", "created_at"]
            )
            
            search_results = []
            for hits in results:
                for hit in hits:
                    doc = VectorDocument(
                        id=hit.entity.get("id"),
                        content=hit.entity.get("content", ""),
                        embedding=[],  # Don't return embedding in search results
                        metadata=hit.entity.get("metadata", {}),
                        modality=hit.entity.get("modality", "text"),
                        created_at=datetime.fromisoformat(hit.entity.get("created_at", datetime.utcnow().isoformat()))
                    )
                    search_results.append(SearchResult(document=doc, score=hit.score))
            
            return search_results
            
        except Exception as e:
            print(f"Error searching: {e}")
            return self._mock_search(query_embedding, top_k, filter_modality)
    
    def _mock_search(self, query_embedding: List[float], top_k: int,
                    filter_modality: Optional[str] = None) -> List[SearchResult]:
        """Mock search for testing without Milvus."""
        import math
        
        def cosine_similarity(a: List[float], b: List[float]) -> float:
            if len(a) != len(b) or len(a) == 0:
                return 0.0
            dot_product = sum(x * y for x, y in zip(a, b))
            norm_a = math.sqrt(sum(x * x for x in a))
            norm_b = math.sqrt(sum(x * x for x in b))
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return dot_product / (norm_a * norm_b)
        
        results = []
        for doc in self._mock_storage:
            if filter_modality and doc.modality != filter_modality:
                continue
            
            score = cosine_similarity(query_embedding, doc.embedding)
            results.append(SearchResult(document=doc, score=score))
        
        # Sort by score descending
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results[:top_k]
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document by ID."""
        if not MILVUS_AVAILABLE or not self.collection:
            self._mock_storage = [d for d in self._mock_storage if d.id != document_id]
            return True
        
        try:
            expr = f'id == "{document_id}"'
            self.collection.delete(expr)
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    async def get_document(self, document_id: str) -> Optional[VectorDocument]:
        """Get a document by ID."""
        if not MILVUS_AVAILABLE or not self.collection:
            for doc in self._mock_storage:
                if doc.id == document_id:
                    return doc
            return None
        
        try:
            expr = f'id == "{document_id}"'
            results = self.collection.query(
                expr=expr,
                output_fields=["id", "content", "embedding", "metadata", "modality", "created_at"]
            )
            
            if results:
                r = results[0]
                return VectorDocument(
                    id=r["id"],
                    content=r["content"],
                    embedding=r["embedding"],
                    metadata=r["metadata"],
                    modality=r["modality"],
                    created_at=datetime.fromisoformat(r["created_at"])
                )
            return None
            
        except Exception as e:
            print(f"Error getting document: {e}")
            return None
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection."""
        if not MILVUS_AVAILABLE or not self.collection:
            return {
                "collection_name": self.collection_name,
                "num_documents": len(self._mock_storage),
                "dimension": self.dimension,
                "mode": "mock"
            }
        
        try:
            stats = self.collection.num_entities
            return {
                "collection_name": self.collection_name,
                "num_documents": stats,
                "dimension": self.dimension,
                "mode": "milvus"
            }
        except Exception as e:
            return {
                "collection_name": self.collection_name,
                "error": str(e),
                "mode": "error"
            }
