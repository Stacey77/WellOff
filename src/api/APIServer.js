/**
 * WellOff AI Platform - REST API Layer
 * 
 * Provides RESTful API endpoints for all platform capabilities:
 * - Chat and conversation management
 * - Vector search operations
 * - Workflow execution
 * - RAG queries
 * - Voice processing
 * - AI generation
 */

import http from 'http';
import { URL } from 'url';

export class APIServer {
  constructor(platform, config = {}) {
    this.platform = platform;
    this.config = {
      port: config.port || 3001,
      cors: config.cors !== false,
      ...config
    };
    this.server = null;
    this.routes = new Map();
    this.middlewares = [];
    
    this.setupRoutes();
  }

  /**
   * Setup all API routes
   */
  setupRoutes() {
    // Health check
    this.addRoute('GET', '/api/health', async () => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));

    // Chat endpoints
    this.addRoute('POST', '/api/chat', async (req) => {
      const { message, sessionId } = req.body;
      return this.platform.processRequest(message, { sessionId });
    });

    this.addRoute('POST', '/api/chat/confirm', async (req) => {
      const { sessionId, response } = req.body;
      return this.platform.processRequest(response, { sessionId });
    });

    // Vector search endpoints
    this.addRoute('POST', '/api/vectors/search', async (req) => {
      const { query, collection, topK } = req.body;
      const embedding = await this.platform.milvusClient.createEmbedding(query);
      return this.platform.milvusClient.search(collection, embedding, { topK });
    });

    this.addRoute('POST', '/api/vectors/insert', async (req) => {
      const { collection, data } = req.body;
      return this.platform.milvusClient.insert(collection, data);
    });

    this.addRoute('GET', '/api/vectors/collections', async () => {
      return this.platform.milvusClient.listCollections();
    });

    // Workflow endpoints
    this.addRoute('POST', '/api/workflows/execute', async (req) => {
      const { workflowId, data } = req.body;
      return this.platform.executeWorkflow(workflowId, data);
    });

    this.addRoute('POST', '/api/workflows/create', async (req) => {
      const { name, config } = req.body;
      return this.platform.n8nIntegration.createWorkflow({ name, ...config });
    });

    this.addRoute('GET', '/api/workflows', async () => {
      return this.platform.n8nIntegration.listWorkflows();
    });

    // RAG endpoints
    this.addRoute('POST', '/api/rag/query', async (req) => {
      const { text, image, audio, options } = req.body;
      return this.platform.queryRAG({ text, image, audio, options });
    });

    this.addRoute('POST', '/api/rag/ingest', async (req) => {
      const { type, data, metadata } = req.body;
      return this.platform.rag.ingest({ type, data, metadata });
    });

    // Voice endpoints
    this.addRoute('POST', '/api/voice/transcribe', async (req) => {
      const { audio } = req.body;
      return this.platform.voiceAgent.transcribeAudio(audio);
    });

    this.addRoute('POST', '/api/voice/synthesize', async (req) => {
      const { text, voice } = req.body;
      return this.platform.voiceAgent.generateVoiceResponse({ message: text }, { voice });
    });

    this.addRoute('POST', '/api/voice/session/start', async () => {
      return this.platform.voiceAgent.startVoiceSession();
    });

    this.addRoute('POST', '/api/voice/session/end', async (req) => {
      const { sessionId } = req.body;
      return this.platform.voiceAgent.endVoiceSession(sessionId);
    });

    // AI Generation endpoints
    this.addRoute('POST', '/api/generate', async (req) => {
      const { prompt, options } = req.body;
      return this.platform.generate(prompt, options);
    });

    this.addRoute('POST', '/api/generate/chat', async (req) => {
      const { messages, options } = req.body;
      return this.platform.chat(messages, options);
    });

    this.addRoute('POST', '/api/generate/embeddings', async (req) => {
      const { input, options } = req.body;
      return this.platform.nanoBananaPro.createEmbedding(input, options);
    });

    // Platform info
    this.addRoute('GET', '/api/info', async () => ({
      name: 'WellOff AI Platform',
      version: '1.0.0',
      components: {
        conversationalAI: true,
        milvus: this.platform.milvusClient.connected,
        n8n: this.platform.n8nIntegration.initialized,
        rag: this.platform.rag.initialized,
        voice: this.platform.voiceAgent.initialized,
        nanoBananaPro: this.platform.nanoBananaPro.initialized,
        nest: this.platform.nest.initialized
      }
    }));
  }

  /**
   * Add a route
   */
  addRoute(method, path, handler) {
    const key = `${method}:${path}`;
    this.routes.set(key, handler);
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Parse request body
   */
  async parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          resolve({});
        }
      });
      req.on('error', reject);
    });
  }

  /**
   * Handle incoming request
   */
  async handleRequest(req, res) {
    // CORS headers
    if (this.config.cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${this.config.port}`);
    const path = url.pathname;
    const key = `${req.method}:${path}`;

    // Find route
    const handler = this.routes.get(key);
    
    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
      return;
    }

    try {
      // Parse body
      const body = await this.parseBody(req);
      
      // Create request context
      const context = {
        method: req.method,
        path,
        query: Object.fromEntries(url.searchParams),
        headers: req.headers,
        body
      };

      // Run middlewares
      for (const middleware of this.middlewares) {
        await middleware(context);
      }

      // Execute handler
      const result = await handler(context);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  }

  /**
   * Start the API server
   */
  async start() {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(this.config.port, () => {
        console.log(`🌐 API Server running at http://localhost:${this.config.port}`);
        resolve(this);
      });
    });
  }

  /**
   * Stop the API server
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🔌 API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default APIServer;
