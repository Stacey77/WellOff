/**
 * WellOff AI Platform
 * 
 * A powerful AI platform that combines:
 * - Conversational AI with confirmation flows ("Is this what you want?")
 * - Milvus vector database for similarity search
 * - n8n workflow automation
 * - Multimodal RAG (Retrieval-Augmented Generation)
 * - AI Voice Agent for voice interactions
 * - Nano Banana Pro for efficient AI inference
 * - NestJS-style modular architecture
 */

import { WellOffPlatform } from './core/WellOffPlatform.js';

// Export main platform class
export { WellOffPlatform };

// Export individual components for direct use
export { ConversationalAI } from './conversational/ConversationalAI.js';
export { MilvusClient } from './milvus/MilvusClient.js';
export { N8NIntegration } from './n8n/N8NIntegration.js';
export { MultimodalRAG } from './rag/MultimodalRAG.js';
export { VoiceAgent } from './voice/VoiceAgent.js';
export { NanoBananaPro } from './nanobanana/NanoBananaPro.js';
export { NestIntegration, Module, Controller, Guard, Interceptor, Middleware } from './nest/NestIntegration.js';

/**
 * Quick start function to create and initialize the platform
 * @param {Object} config - Platform configuration
 * @returns {Promise<WellOffPlatform>} - Initialized platform instance
 */
export async function createPlatform(config = {}) {
  const platform = new WellOffPlatform(config);
  await platform.initialize();
  return platform;
}

// Demo usage when run directly
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              Welcome to WellOff AI Platform                    ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Features:');
  console.log('  🤖 Conversational AI with confirmation flow');
  console.log('  🔍 Milvus Vector Database Integration');
  console.log('  ⚙️  n8n Workflow Automation');
  console.log('  📚 Multimodal RAG (Text, Image, Audio)');
  console.log('  🎙️  AI Voice Agent');
  console.log('  🍌 Nano Banana Pro AI Inference');
  console.log('  🪺 NestJS-style Modular Architecture');
  console.log('');

  try {
    // Create and initialize the platform
    const platform = await createPlatform({
      milvusHost: 'localhost',
      milvusPort: 19530,
      n8nWebhookUrl: 'http://localhost:5678',
      voiceEnabled: true,
      nanoBananaEnabled: true,
      nestEnabled: true
    });

    console.log('');
    console.log('Demo: Processing a request with confirmation...');
    console.log('─────────────────────────────────────────────────────────────');
    
    // Demo the confirmation flow
    const request = 'Create a new marketing campaign for our product launch';
    console.log(`User: "${request}"`);
    console.log('');

    const response = await platform.processRequest(request);
    
    console.log('AI Response:');
    console.log(response.message);
    console.log('');
    console.log(`Options: ${response.options.join(', ')}`);
    console.log('');

    // Demo voice agent
    console.log('─────────────────────────────────────────────────────────────');
    console.log('Demo: Voice Session...');
    console.log('');
    
    const voiceSession = await platform.voiceAgent.startVoiceSession();
    console.log(`Voice Session Started: ${voiceSession.session.id}`);
    console.log(`Welcome: "${voiceSession.welcome.text}"`);
    console.log('');

    // Demo RAG query
    console.log('─────────────────────────────────────────────────────────────');
    console.log('Demo: Multimodal RAG Query...');
    console.log('');
    
    const ragResult = await platform.queryRAG({
      text: 'Find information about AI assistants'
    });
    console.log(`RAG Query processed: ${ragResult.augmentedResponse.response}`);
    console.log('');

    // Demo Nano Banana Pro
    console.log('─────────────────────────────────────────────────────────────');
    console.log('Demo: Nano Banana Pro AI Generation...');
    console.log('');
    
    const chatResult = await platform.chat([
      { role: 'user', content: 'Hello, what can you help me with?' }
    ]);
    console.log(`Nano Banana Pro: ${chatResult.choices[0].message.content}`);
    console.log('');

    // Demo Nest Integration
    console.log('─────────────────────────────────────────────────────────────');
    console.log('Demo: NestJS-style API...');
    console.log('');
    
    console.log('Nest Integration Status: Initialized');
    console.log('Available services: ConfigService, LoggerService');
    console.log('');

    // Shutdown
    await platform.shutdown();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('            Platform demo completed successfully!              ');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run main if this is the entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export default WellOffPlatform;
