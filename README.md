# WellOff AI Platform

A powerful conversational AI platform that creates what you ask and confirms before proceeding. Features Milvus vector database integration, n8n workflow automation, multimodal RAG, and AI voice agent capabilities.

## 🚀 Features

### 💬 Conversational AI with Confirmation Flow
- Interactive chat that understands your requests
- **Always asks for confirmation** before executing actions
- "Is this what you want?" - ensures you get exactly what you need
- Supports natural language interaction

### 🔍 Milvus Vector Database Integration
- Semantic search using vector embeddings
- Store and retrieve documents, images, audio, and video
- Fast similarity search across all your content
- Scalable vector storage

### ⚙️ n8n Workflow Automation
- Pre-built workflow templates
- Trigger workflows via webhooks
- AI-powered workflow execution
- Document processing, content generation, notifications, and more

### 📚 Multimodal RAG (Retrieval-Augmented Generation)
- **Text**: Document chunking and processing
- **Image**: Visual understanding and description
- **Audio**: Transcription and indexing
- **Video**: Frame extraction and audio transcription
- Combined context for intelligent responses

### 🎤 AI Voice Agent
- Speech-to-Text (STT) for voice input
- Text-to-Speech (TTS) for voice output
- Real-time voice conversations
- Voice command processing
- Wake word detection

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Stacey77/WellOff.git
cd WellOff

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment example and configure
cp .env.example .env
# Edit .env with your configuration
```

## ⚙️ Configuration

Create a `.env` file with the following settings:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Milvus Configuration
MILVUS_HOST=localhost
MILVUS_PORT=19530

# n8n Configuration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key

# Voice Configuration
VOICE_LANGUAGE=en-US

# Application Settings
DEBUG=false
HOST=0.0.0.0
PORT=8000
```

## 🏃 Running the Application

```bash
# Start the API server
python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# Or use the direct entry point
python src/api/main.py
```

The API will be available at `http://localhost:8000`

- **API Documentation**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 📖 API Usage

### Conversational AI

```bash
# Start a conversation
curl -X POST http://localhost:8000/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a document about AI"}'

# Response includes pending_actions that need confirmation
# Confirm an action
curl -X POST http://localhost:8000/api/conversation/confirm \
  -H "Content-Type: application/json" \
  -d '{"session_id": "...", "action_id": "...", "confirmed": true}'
```

### RAG (Retrieval-Augmented Generation)

```bash
# Ingest a document
curl -X POST http://localhost:8000/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{"content": "Your document content here", "modality": "text"}'

# Search
curl -X POST http://localhost:8000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is AI?", "top_k": 5}'
```

### Workflows

```bash
# List available workflows
curl http://localhost:8000/api/workflows

# Execute AI workflow
curl -X POST http://localhost:8000/api/workflows/ai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Generate a blog post", "workflow_type": "content"}'
```

### Voice Agent

```bash
# Create a voice session
curl -X POST http://localhost:8000/api/voice/session

# Process text through voice agent
curl -X POST http://localhost:8000/api/voice/session/{session_id}/process/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, voice assistant!"}'
```

## 🧪 Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

## 📁 Project Structure

```
WellOff/
├── config/
│   ├── __init__.py
│   └── settings.py          # Application settings
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   └── main.py           # FastAPI application
│   ├── core/
│   │   ├── __init__.py
│   │   └── conversational_ai.py  # Conversational AI engine
│   ├── milvus_integration/
│   │   ├── __init__.py
│   │   └── milvus_client.py  # Milvus vector database client
│   ├── n8n_integration/
│   │   ├── __init__.py
│   │   └── n8n_client.py     # n8n workflow client
│   ├── multimodal_rag/
│   │   ├── __init__.py
│   │   └── rag_engine.py     # Multimodal RAG engine
│   └── voice_agent/
│       ├── __init__.py
│       └── voice_agent.py    # Voice agent implementation
├── tests/
│   ├── test_conversational_ai.py
│   ├── test_milvus.py
│   ├── test_n8n.py
│   ├── test_multimodal_rag.py
│   └── test_voice_agent.py
├── docs/
├── .env.example
├── requirements.txt
└── README.md
```

## 🔌 WebSocket Support

Real-time communication is available via WebSocket:

```javascript
// Conversation WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/conversation/session-id');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Response:', data);
};

ws.send(JSON.stringify({
  type: 'message',
  content: 'Create a document for me'
}));

// Voice WebSocket
const voiceWs = new WebSocket('ws://localhost:8000/ws/voice/session-id');
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT and Whisper models
- Milvus for vector database
- n8n for workflow automation
- FastAPI for the web framework
# WellOff

AI-powered real estate intelligence platform.

---

## Kimi (Moonshot AI) inference backend

WellOff ships a thin provider wrapper that calls the
[Moonshot AI](https://www.moonshot.cn/) OpenAI-compatible API, letting you use
**Kimi** models (e.g. `kimi-k2`, `moonshot-v1-128k`) for AI tasks inside the
platform.

### Quick start

1. **Set your API key** (one of the two env vars is enough):

   ```bash
   export MOONSHOT_API_KEY="sk-..."
   # or
   export OPENAI_API_KEY="sk-..."
   ```

2. **Optional overrides:**

   ```bash
   export KIMI_MODEL="kimi-k2"                        # default
   export KIMI_BASE_URL="https://api.moonshot.cn/v1"  # default
   ```

3. **Use the provider in TypeScript:**

   ```ts
   import { kimiChat } from '@/lib/providers/kimi'

   const reply = await kimiChat(
     [{ role: 'user', content: 'Summarise this property listing…' }],
     { model: 'kimi-k2', temperature: 0.7 },
   )
   console.log(reply)
   ```

4. **Run the example script:**

   ```bash
   export MOONSHOT_API_KEY="sk-..."
   npx ts-node examples/kimi_chat.ts
   ```

5. **Use the REST API route** (Next.js server-side, key never exposed to client):

   ```bash
   curl -X POST http://localhost:3000/api/kimi \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello, Kimi!"}]}'
   ```

### Supported models

| Model ID | Context | Best for |
|---|---|---|
| `kimi-k2` | long | Agentic tasks, reasoning, tool use |
| `moonshot-v1-8k` | 8 K | Fast Q&A, short documents |
| `moonshot-v1-32k` | 32 K | Medium-length documents |
| `moonshot-v1-128k` | 128 K | Long documents, full codebases |

### Architecture presets (OpenMythos)

See [`docs/open_mythos.md`](docs/open_mythos.md) for the full `MythosConfig`
reference including the **Kimi-2.5** and **Kimi-2.6** model-config presets.

---

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run lint
```
