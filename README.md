# WellOff AI Platform

A powerful AI platform that sets itself apart from other vibe-coding tools by providing a conversational AI experience with explicit user confirmation. Unlike other platforms, WellOff **asks you "Is this what you want?"** before executing any action, ensuring your intent is properly understood.

## ✨ Features

### 🤖 Conversational AI with Confirmation Flow
- **Unique confirmation system** - Always verifies understanding before acting
- Intent analysis and entity extraction
- Multi-turn conversation support
- Modification and clarification handling

### 🔍 Milvus Vector Database Integration
- High-performance similarity search
- Collection management for different data types
- Hybrid search (vector + keyword)
- Seamless embedding creation

### ⚙️ n8n Workflow Automation
- Create and manage automated workflows
- Webhook triggers and actions
- AI-powered workflow generation
- Full workflow lifecycle management

### 📚 Multimodal RAG
- Text, image, and audio retrieval
- Document chunking and ingestion
- Cross-modality ranking
- Augmented response generation

### 🎙️ AI Voice Agent
- Speech-to-text transcription
- Text-to-speech synthesis
- Voice session management
- Multiple voice options and languages

### 🍌 Nano Banana Pro AI Inference
- Efficient AI text generation and chat
- Multimodal processing (text, image, audio)
- Embeddings creation for semantic search
- Multiple specialized models (vision, audio)
- Edge-optimized for resource-constrained environments

### 🪺 NestJS-style Modular Architecture
- Dependency injection container
- Module system for organizing functionality
- Controller/Service pattern
- Middleware, Guards, and Interceptors support
- Request routing and parameter extraction

### 🌐 REST API & WebSocket
- Full REST API for all platform features
- Real-time WebSocket communication
- Room-based messaging
- Streaming responses
- CORS support

## 🚀 Quick Start

```javascript
import { createPlatform, APIServer, WebSocketServer } from 'welloff-ai-platform';

// Create and initialize the platform
const platform = await createPlatform({
  milvusHost: 'localhost',
  milvusPort: 19530,
  n8nWebhookUrl: 'http://localhost:5678',
  voiceEnabled: true,
  nanoBananaEnabled: true,
  nestEnabled: true
});

// Process a request with confirmation
const response = await platform.processRequest('Create a new marketing campaign');

// Response includes confirmation question
console.log(response.message);  // Explains what will be done
console.log(response.question); // "Is this what you want?"
console.log(response.options);  // ['Yes, proceed', 'No, let me clarify', 'Modify this']

// Chat with Nano Banana Pro
const chatResponse = await platform.chat([
  { role: 'user', content: 'Hello, how can you help me?' }
]);
console.log(chatResponse.choices[0].message.content);
```

## 📦 Installation

```bash
npm install
npm start
```

## 🏗️ Architecture

```
src/
├── index.js                 # Main entry point
├── core/
│   └── WellOffPlatform.js   # Platform orchestrator
├── api/
│   ├── APIServer.js         # REST API server
│   └── WebSocketServer.js   # Real-time WebSocket server
├── conversational/
│   └── ConversationalAI.js  # Conversational AI with confirmation
├── milvus/
│   └── MilvusClient.js      # Milvus vector database client
├── n8n/
│   └── N8NIntegration.js    # n8n workflow automation
├── nanobanana/
│   └── NanoBananaPro.js     # Nano Banana Pro AI inference
├── nest/
│   └── NestIntegration.js   # NestJS-style modular architecture
├── rag/
│   └── MultimodalRAG.js     # Multimodal RAG system
└── voice/
    └── VoiceAgent.js        # AI Voice Agent
```

## 🌐 API Endpoints

```
GET  /api/health              - Health check
GET  /api/info                - Platform information
POST /api/chat                - Send chat message
POST /api/chat/confirm        - Confirm/modify action
POST /api/vectors/search      - Vector similarity search
POST /api/vectors/insert      - Insert vectors
GET  /api/vectors/collections - List collections
POST /api/workflows/execute   - Execute workflow
POST /api/workflows/create    - Create workflow
GET  /api/workflows           - List workflows
POST /api/rag/query           - RAG query
POST /api/rag/ingest          - Ingest documents
POST /api/voice/transcribe    - Transcribe audio
POST /api/voice/synthesize    - Synthesize speech
POST /api/generate            - Generate text
POST /api/generate/chat       - Chat completion
POST /api/generate/embeddings - Create embeddings
```

## 💬 Confirmation Flow Example

What makes WellOff unique is its confirmation-first approach:

```javascript
// User makes a request
const response = await platform.processRequest('Delete all old files');

// Platform responds with confirmation
// {
//   type: 'confirmation_request',
//   message: 'I understand you want me to: Remove the specified item...',
//   proposedAction: { type: 'delete', steps: [...] },
//   question: 'Is this what you want?',
//   options: ['Yes, proceed', 'No, let me clarify', 'Modify this']
// }

// User confirms
const result = await platform.processRequest('yes', { sessionId: response.sessionId });

// Now the action is executed
```

## 🎙️ Voice Interaction

```javascript
// Start a voice session
const session = await platform.voiceAgent.startVoiceSession();

// Process voice input
const result = await platform.processVoiceRequest(audioBuffer);

// result includes:
// - transcription (what the user said)
// - response (AI response with confirmation)
// - voiceResponse (audio response data)
```

## 📚 RAG Queries

```javascript
// Multimodal query
const result = await platform.queryRAG({
  text: 'Find information about AI assistants',
  image: imageBuffer,  // Optional
  audio: audioBuffer   // Optional
});

// Ingest new content
await platform.rag.ingest({
  type: 'document',
  data: documentContent,
  metadata: { source: 'knowledge-base', category: 'ai' }
});
```

## ⚙️ Workflow Automation

```javascript
// Create a workflow
const workflow = await platform.n8nIntegration.createWorkflow({
  name: 'AI Response Handler',
  type: 'automate',
  webhookPath: 'ai-handler'
});

// Execute a workflow
const execution = await platform.executeWorkflow(workflow.id, {
  input: 'process this data'
});
```

## 🔧 Configuration

```javascript
const config = {
  // Milvus settings
  milvusHost: 'localhost',
  milvusPort: 19530,
  
  // n8n settings
  n8nWebhookUrl: 'http://localhost:5678',
  n8nApiKey: 'your-api-key',
  
  // Voice settings
  voiceEnabled: true
};

const platform = new WellOffPlatform(config);
```

## 🧪 Running the Demo

```bash
npm start
```

This will run a demonstration showing:
1. Platform initialization
2. Conversational AI with confirmation
3. Voice session creation
4. RAG query processing

## 📄 License

MIT