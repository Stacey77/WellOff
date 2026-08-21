"""
Tests for the Milvus integration module
"""
import pytest
import asyncio

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from milvus_integration.milvus_client import MilvusClient, VectorDocument, SearchResult


class TestMilvusClient:
    """Tests for the MilvusClient class."""
    
    def test_client_initialization(self):
        """Test client initialization."""
        client = MilvusClient(
            host="localhost",
            port=19530,
            collection_name="test_collection",
            dimension=1536
        )
        
        assert client.host == "localhost"
        assert client.port == 19530
        assert client.collection_name == "test_collection"
        assert client.dimension == 1536
    
    def test_connect(self):
        """Test connecting to Milvus (mock mode)."""
        client = MilvusClient()
        result = client.connect()
        
        assert result is True
        assert client._connected is True
    
    def test_disconnect(self):
        """Test disconnecting from Milvus."""
        client = MilvusClient()
        client.connect()
        client.disconnect()
        
        assert client._connected is False
    
    @pytest.mark.asyncio
    async def test_insert_document(self):
        """Test inserting a document."""
        client = MilvusClient()
        client.connect()
        
        embedding = [0.1] * 1536  # Mock embedding
        doc = await client.insert_document(
            content="Test content",
            embedding=embedding,
            metadata={"key": "value"},
            modality="text"
        )
        
        assert doc is not None
        assert doc.content == "Test content"
        assert doc.modality == "text"
        assert len(client._mock_storage) == 1
    
    @pytest.mark.asyncio
    async def test_insert_documents_batch(self):
        """Test inserting multiple documents in batch."""
        client = MilvusClient()
        client.connect()
        
        documents = [
            {
                "content": f"Document {i}",
                "embedding": [0.1 * i] * 1536,
                "metadata": {"index": i},
                "modality": "text"
            }
            for i in range(3)
        ]
        
        results = await client.insert_documents_batch(documents)
        
        assert len(results) == 3
        assert len(client._mock_storage) == 3
    
    @pytest.mark.asyncio
    async def test_search(self):
        """Test searching for documents."""
        client = MilvusClient()
        client.connect()
        
        # Insert some documents
        for i in range(3):
            await client.insert_document(
                content=f"Document {i}",
                embedding=[0.1 + (i * 0.1)] * 1536,
                modality="text"
            )
        
        # Search
        query_embedding = [0.15] * 1536
        results = await client.search(query_embedding, top_k=2)
        
        assert len(results) <= 2
        for result in results:
            assert isinstance(result, SearchResult)
    
    @pytest.mark.asyncio
    async def test_search_with_modality_filter(self):
        """Test searching with modality filter."""
        client = MilvusClient()
        client.connect()
        
        # Insert documents of different modalities
        await client.insert_document("Text doc", [0.1] * 1536, modality="text")
        await client.insert_document("Image doc", [0.2] * 1536, modality="image")
        await client.insert_document("Audio doc", [0.3] * 1536, modality="audio")
        
        # Search only for text
        results = await client.search([0.15] * 1536, top_k=5, filter_modality="text")
        
        assert len(results) >= 1
        for result in results:
            assert result.document.modality == "text"
    
    @pytest.mark.asyncio
    async def test_delete_document(self):
        """Test deleting a document."""
        client = MilvusClient()
        client.connect()
        
        doc = await client.insert_document(
            content="To be deleted",
            embedding=[0.1] * 1536,
            modality="text"
        )
        
        assert len(client._mock_storage) == 1
        
        result = await client.delete_document(doc.id)
        
        assert result is True
        assert len(client._mock_storage) == 0
    
    @pytest.mark.asyncio
    async def test_get_document(self):
        """Test getting a document by ID."""
        client = MilvusClient()
        client.connect()
        
        doc = await client.insert_document(
            content="Get me",
            embedding=[0.1] * 1536,
            modality="text"
        )
        
        retrieved = await client.get_document(doc.id)
        
        assert retrieved is not None
        assert retrieved.id == doc.id
        assert retrieved.content == "Get me"
    
    def test_get_collection_stats(self):
        """Test getting collection statistics."""
        client = MilvusClient()
        client.connect()
        
        stats = client.get_collection_stats()
        
        assert "collection_name" in stats
        assert "num_documents" in stats
        assert "dimension" in stats


class TestVectorDocument:
    """Tests for the VectorDocument dataclass."""
    
    def test_document_to_dict(self):
        """Test converting document to dict."""
        from datetime import datetime
        
        doc = VectorDocument(
            id="test-id",
            content="Test content",
            embedding=[0.1] * 10,
            metadata={"key": "value"},
            modality="text",
            created_at=datetime.utcnow()
        )
        
        result = doc.to_dict()
        
        assert result["id"] == "test-id"
        assert result["modality"] == "text"
        assert "content" in result  # Content is truncated
        assert "embedding" not in result  # Embedding not in dict


class TestSearchResult:
    """Tests for the SearchResult dataclass."""
    
    def test_search_result_to_dict(self):
        """Test converting search result to dict."""
        from datetime import datetime
        
        doc = VectorDocument(
            id="test-id",
            content="Test content",
            embedding=[],
            metadata={},
            modality="text",
            created_at=datetime.utcnow()
        )
        
        result = SearchResult(document=doc, score=0.95)
        result_dict = result.to_dict()
        
        assert "document" in result_dict
        assert result_dict["score"] == 0.95
