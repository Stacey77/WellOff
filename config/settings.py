"""
WellOff AI Platform Configuration Settings
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    app_name: str = "WellOff AI Platform"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    
    # Milvus Configuration
    milvus_host: str = "localhost"
    milvus_port: int = 19530
    milvus_collection_name: str = "welloff_vectors"
    milvus_dimension: int = 1536  # OpenAI embedding dimension
    
    # n8n Configuration
    n8n_base_url: str = "http://localhost:5678"
    n8n_webhook_path: str = "/webhook"
    n8n_api_key: Optional[str] = None
    
    # Voice Agent Configuration
    voice_sample_rate: int = 16000
    voice_channels: int = 1
    voice_language: str = "en-US"
    tts_voice: str = "default"
    
    # RAG Configuration
    embedding_model: str = "text-embedding-ada-002"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_results: int = 5
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
