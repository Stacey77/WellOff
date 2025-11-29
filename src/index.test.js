/**
 * Tests for WellOff AI Platform
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { WellOffPlatform, createPlatform } from './index.js';
import { ConversationalAI } from './conversational/ConversationalAI.js';
import { MilvusClient } from './milvus/MilvusClient.js';
import { N8NIntegration } from './n8n/N8NIntegration.js';
import { MultimodalRAG } from './rag/MultimodalRAG.js';
import { VoiceAgent } from './voice/VoiceAgent.js';

describe('WellOff Platform', () => {
  test('should create platform instance', () => {
    const platform = new WellOffPlatform();
    assert.ok(platform);
    assert.ok(platform.conversationalAI);
    assert.ok(platform.milvusClient);
    assert.ok(platform.n8nIntegration);
    assert.ok(platform.rag);
    assert.ok(platform.voiceAgent);
  });

  test('should initialize platform', async () => {
    const platform = new WellOffPlatform();
    await platform.initialize();
    assert.ok(platform.milvusClient.connected);
    await platform.shutdown();
  });

  test('should create platform with createPlatform helper', async () => {
    const platform = await createPlatform();
    assert.ok(platform);
    assert.ok(platform.milvusClient.connected);
    await platform.shutdown();
  });
});

describe('Conversational AI', () => {
  test('should process request with confirmation', async () => {
    const platform = new WellOffPlatform();
    const ai = platform.conversationalAI;
    
    const response = await ai.processWithConfirmation('Create a new document');
    
    assert.strictEqual(response.type, 'confirmation_request');
    assert.ok(response.sessionId);
    assert.ok(response.message);
    assert.strictEqual(response.question, 'Is this what you want?');
    assert.ok(Array.isArray(response.options));
    assert.ok(response.options.includes('Yes, proceed'));
  });

  test('should analyze intent correctly', async () => {
    const platform = new WellOffPlatform();
    const ai = platform.conversationalAI;
    
    const createIntent = await ai.analyzeIntent('Create a new project');
    assert.strictEqual(createIntent.primaryIntent, 'create');
    
    const queryIntent = await ai.analyzeIntent('Find information about AI');
    assert.strictEqual(queryIntent.primaryIntent, 'query');
    
    const deleteIntent = await ai.analyzeIntent('Delete the old files');
    assert.strictEqual(deleteIntent.primaryIntent, 'delete');
  });

  test('should handle affirmative confirmation', async () => {
    const platform = new WellOffPlatform();
    const ai = platform.conversationalAI;
    
    // First request gets confirmation
    const response = await ai.processWithConfirmation('Create something');
    const sessionId = response.sessionId;
    
    // Confirm the action
    const result = await ai.processWithConfirmation('yes', { sessionId });
    
    assert.strictEqual(result.type, 'execution_result');
    assert.strictEqual(result.success, true);
  });

  test('should handle negative confirmation', async () => {
    const platform = new WellOffPlatform();
    const ai = platform.conversationalAI;
    
    const response = await ai.processWithConfirmation('Create something');
    const sessionId = response.sessionId;
    
    const result = await ai.processWithConfirmation('no', { sessionId });
    
    assert.strictEqual(result.type, 'clarification_request');
  });

  test('should extract entities from input', async () => {
    const platform = new WellOffPlatform();
    const ai = platform.conversationalAI;
    
    const intent = await ai.analyzeIntent('Create "MyProject" with 5 items today');
    
    assert.ok(intent.entities.subjects.includes('MyProject'));
    assert.ok(intent.entities.quantities.includes(5));
    assert.ok(intent.entities.timeReferences.includes('today'));
  });
});

describe('Milvus Client', () => {
  test('should connect and disconnect', async () => {
    const client = new MilvusClient();
    
    await client.connect();
    assert.strictEqual(client.connected, true);
    
    await client.disconnect();
    assert.strictEqual(client.connected, false);
  });

  test('should create collection', async () => {
    const client = new MilvusClient();
    await client.connect();
    
    const schema = await client.createCollection('test_collection');
    
    assert.strictEqual(schema.name, 'test_collection');
    
    const collections = await client.listCollections();
    assert.ok(collections.includes('test_collection'));
    
    await client.disconnect();
  });

  test('should perform search', async () => {
    const client = new MilvusClient();
    await client.connect();
    await client.createCollection('search_test');
    
    const vector = await client.createEmbedding('test query');
    const result = await client.search('search_test', vector, { topK: 5 });
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.params.topK, 5);
    
    await client.disconnect();
  });
});

describe('n8n Integration', () => {
  test('should initialize', async () => {
    const n8n = new N8NIntegration();
    await n8n.initialize();
    
    assert.strictEqual(n8n.initialized, true);
    
    await n8n.cleanup();
  });

  test('should create workflow', async () => {
    const n8n = new N8NIntegration();
    await n8n.initialize();
    
    const workflow = await n8n.createWorkflow({
      name: 'Test Workflow',
      type: 'automate'
    });
    
    assert.ok(workflow.id);
    assert.strictEqual(workflow.name, 'Test Workflow');
    assert.ok(workflow.nodes.length > 0);
    
    await n8n.cleanup();
  });

  test('should execute workflow', async () => {
    const n8n = new N8NIntegration();
    await n8n.initialize();
    
    const execution = await n8n.executeWorkflow('test-workflow', { input: 'data' });
    
    assert.strictEqual(execution.status, 'completed');
    assert.strictEqual(execution.result.success, true);
    
    await n8n.cleanup();
  });
});

describe('Multimodal RAG', () => {
  test('should initialize with collections', async () => {
    const milvus = new MilvusClient();
    await milvus.connect();
    
    const rag = new MultimodalRAG(milvus);
    await rag.initialize();
    
    const stats = await rag.getStats();
    assert.ok(stats.collections.text);
    assert.ok(stats.collections.image);
    assert.ok(stats.collections.audio);
    
    await milvus.disconnect();
  });

  test('should query text', async () => {
    const milvus = new MilvusClient();
    await milvus.connect();
    
    const rag = new MultimodalRAG(milvus);
    await rag.initialize();
    
    const result = await rag.query({ text: 'test query' });
    
    assert.ok(result.augmentedResponse);
    assert.ok(Array.isArray(result.retrievedContext));
    
    await milvus.disconnect();
  });

  test('should chunk documents', async () => {
    const milvus = new MilvusClient();
    await milvus.connect();
    
    const rag = new MultimodalRAG(milvus);
    
    const longDocument = 'A'.repeat(1000);
    const chunks = await rag.chunkDocument(longDocument);
    
    assert.ok(chunks.length > 1);
    assert.ok(chunks[0].metadata.chunkIndex === 0);
    
    await milvus.disconnect();
  });
});

describe('Voice Agent', () => {
  test('should initialize', async () => {
    const platform = new WellOffPlatform();
    const voice = platform.voiceAgent;
    
    await voice.initialize();
    assert.strictEqual(voice.initialized, true);
    
    await voice.shutdown();
  });

  test('should start voice session', async () => {
    const platform = new WellOffPlatform();
    const voice = platform.voiceAgent;
    await voice.initialize();
    
    const session = await voice.startVoiceSession();
    
    assert.ok(session.session.id);
    assert.strictEqual(session.session.active, true);
    assert.ok(session.welcome.text);
    
    await voice.shutdown();
  });

  test('should transcribe audio', async () => {
    const platform = new WellOffPlatform();
    const voice = platform.voiceAgent;
    await voice.initialize();
    
    const transcription = await voice.transcribeAudio('/path/to/audio.wav');
    
    assert.ok(transcription.text);
    assert.ok(transcription.confidence > 0);
    
    await voice.shutdown();
  });

  test('should handle voice commands', async () => {
    const platform = new WellOffPlatform();
    const voice = platform.voiceAgent;
    
    const helpResult = await voice.handleVoiceCommand('help');
    assert.strictEqual(helpResult.action, 'help');
    
    const stopResult = await voice.handleVoiceCommand('stop');
    assert.strictEqual(stopResult.action, 'stop');
  });

  test('should get available voices', async () => {
    const platform = new WellOffPlatform();
    const voice = platform.voiceAgent;
    await voice.initialize();
    
    const voices = await voice.getAvailableVoices();
    
    assert.ok(Array.isArray(voices));
    assert.ok(voices.length > 0);
    assert.ok(voices[0].id);
    assert.ok(voices[0].name);
    
    await voice.shutdown();
  });
});

console.log('Running WellOff AI Platform tests...');
