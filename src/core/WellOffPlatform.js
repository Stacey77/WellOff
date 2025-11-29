/**
 * WellOff AI Platform - Core Orchestrator
 * 
 * This module orchestrates all AI components:
 * - Conversational AI with confirmation flow
 * - Milvus vector database integration
 * - n8n workflow automation
 * - Multimodal RAG
 * - AI Voice Agent
 */

import { ConversationalAI } from '../conversational/ConversationalAI.js';
import { MilvusClient } from '../milvus/MilvusClient.js';
import { N8NIntegration } from '../n8n/N8NIntegration.js';
import { MultimodalRAG } from '../rag/MultimodalRAG.js';
import { VoiceAgent } from '../voice/VoiceAgent.js';

export class WellOffPlatform {
  constructor(config = {}) {
    this.config = {
      milvusHost: config.milvusHost || 'localhost',
      milvusPort: config.milvusPort || 19530,
      n8nWebhookUrl: config.n8nWebhookUrl || 'http://localhost:5678',
      voiceEnabled: config.voiceEnabled !== false,
      ...config
    };

    this.conversationalAI = new ConversationalAI(this);
    this.milvusClient = new MilvusClient(this.config);
    this.n8nIntegration = new N8NIntegration(this.config);
    this.rag = new MultimodalRAG(this.milvusClient);
    this.voiceAgent = new VoiceAgent(this.conversationalAI);
  }

  /**
   * Initialize all platform components
   */
  async initialize() {
    console.log('🚀 Initializing WellOff AI Platform...');
    
    await this.milvusClient.connect();
    await this.n8nIntegration.initialize();
    await this.rag.initialize();
    
    if (this.config.voiceEnabled) {
      await this.voiceAgent.initialize();
    }
    
    console.log('✅ WellOff AI Platform initialized successfully!');
    return this;
  }

  /**
   * Process user request with confirmation flow
   * @param {string} userInput - The user's request
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - The processed result
   */
  async processRequest(userInput, options = {}) {
    return this.conversationalAI.processWithConfirmation(userInput, options);
  }

  /**
   * Process voice input
   * @param {Buffer|string} audioInput - Audio data or file path
   * @returns {Promise<Object>} - The processed result with voice response
   */
  async processVoiceRequest(audioInput) {
    return this.voiceAgent.processVoiceInput(audioInput);
  }

  /**
   * Execute a workflow via n8n
   * @param {string} workflowId - The workflow identifier
   * @param {Object} data - Data to pass to the workflow
   * @returns {Promise<Object>} - Workflow execution result
   */
  async executeWorkflow(workflowId, data) {
    return this.n8nIntegration.executeWorkflow(workflowId, data);
  }

  /**
   * Perform multimodal RAG query
   * @param {Object} query - Query containing text and/or media
   * @returns {Promise<Object>} - RAG response with retrieved context
   */
  async queryRAG(query) {
    return this.rag.query(query);
  }

  /**
   * Shutdown the platform gracefully
   */
  async shutdown() {
    console.log('🔄 Shutting down WellOff AI Platform...');
    
    await this.milvusClient.disconnect();
    await this.n8nIntegration.cleanup();
    
    if (this.config.voiceEnabled) {
      await this.voiceAgent.shutdown();
    }
    
    console.log('👋 WellOff AI Platform shut down successfully!');
  }
}

export default WellOffPlatform;
