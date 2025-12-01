/**
 * WellOff AI Platform - WebSocket Server
 * 
 * Provides real-time communication for:
 * - Live chat sessions
 * - Streaming AI responses
 * - Voice processing events
 * - Workflow status updates
 */

import { EventEmitter } from 'events';

export class WebSocketServer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: config.port || 3002,
      ...config
    };
    this.clients = new Map();
    this.rooms = new Map();
    this.messageHandlers = new Map();
    
    this.setupHandlers();
  }

  /**
   * Setup default message handlers
   */
  setupHandlers() {
    // Join room
    this.onMessage('join', (client, data) => {
      const { room } = data;
      this.joinRoom(client.id, room);
      this.send(client.id, { type: 'joined', room });
    });

    // Leave room
    this.onMessage('leave', (client, data) => {
      const { room } = data;
      this.leaveRoom(client.id, room);
      this.send(client.id, { type: 'left', room });
    });

    // Ping/pong for keep-alive
    this.onMessage('ping', (client) => {
      this.send(client.id, { type: 'pong', timestamp: Date.now() });
    });

    // Chat message
    this.onMessage('chat', (client, data) => {
      this.emit('chat', { clientId: client.id, ...data });
    });

    // Voice data
    this.onMessage('voice', (client, data) => {
      this.emit('voice', { clientId: client.id, ...data });
    });

    // Subscribe to events
    this.onMessage('subscribe', (client, data) => {
      const { events } = data;
      client.subscriptions = client.subscriptions || new Set();
      events.forEach(e => client.subscriptions.add(e));
      this.send(client.id, { type: 'subscribed', events });
    });
  }

  /**
   * Register a message handler
   */
  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Simulate a client connection
   */
  connect(clientId, metadata = {}) {
    const client = {
      id: clientId,
      metadata,
      subscriptions: new Set(),
      rooms: new Set(),
      connectedAt: Date.now(),
      lastActivity: Date.now()
    };
    
    this.clients.set(clientId, client);
    this.emit('connection', client);
    
    return client;
  }

  /**
   * Simulate a client disconnection
   */
  disconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      // Leave all rooms
      client.rooms.forEach(room => this.leaveRoom(clientId, room));
      
      this.clients.delete(clientId);
      this.emit('disconnection', client);
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = Date.now();
    
    const { type, ...data } = message;
    const handler = this.messageHandlers.get(type);
    
    if (handler) {
      handler(client, data);
    } else {
      this.emit('message', { client, type, data });
    }
  }

  /**
   * Send message to a client
   */
  send(clientId, message) {
    const client = this.clients.get(clientId);
    if (client) {
      this.emit('outgoing', { clientId, message });
      return true;
    }
    return false;
  }

  /**
   * Broadcast to all clients
   */
  broadcast(message, exclude = []) {
    this.clients.forEach((client, clientId) => {
      if (!exclude.includes(clientId)) {
        this.send(clientId, message);
      }
    });
  }

  /**
   * Broadcast to a room
   */
  broadcastToRoom(room, message, exclude = []) {
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.forEach(clientId => {
        if (!exclude.includes(clientId)) {
          this.send(clientId, message);
        }
      });
    }
  }

  /**
   * Join a room
   */
  joinRoom(clientId, room) {
    const client = this.clients.get(clientId);
    if (!client) return false;

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    
    this.rooms.get(room).add(clientId);
    client.rooms.add(room);
    
    this.emit('roomJoin', { clientId, room });
    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(clientId, room) {
    const client = this.clients.get(clientId);
    if (!client) return false;

    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(clientId);
      if (roomClients.size === 0) {
        this.rooms.delete(room);
      }
    }
    
    client.rooms.delete(room);
    
    this.emit('roomLeave', { clientId, room });
    return true;
  }

  /**
   * Get room members
   */
  getRoomMembers(room) {
    return Array.from(this.rooms.get(room) || []);
  }

  /**
   * Send event to subscribed clients
   */
  emitEvent(eventType, data) {
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions && client.subscriptions.has(eventType)) {
        this.send(clientId, { type: 'event', eventType, data });
      }
    });
  }

  /**
   * Stream data to a client
   */
  async stream(clientId, generator) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.send(clientId, { type: 'stream_start' });
    
    let index = 0;
    for await (const chunk of generator) {
      this.send(clientId, { type: 'stream_data', index: index++, chunk });
    }
    
    this.send(clientId, { type: 'stream_end', totalChunks: index });
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([room, clients]) => ({
        room,
        members: clients.size
      }))
    };
  }

  /**
   * Initialize the WebSocket server
   */
  async initialize() {
    console.log('🔌 WebSocket Server initialized (simulation mode)');
    console.log(`   Ready to accept connections on port ${this.config.port}`);
    return this;
  }

  /**
   * Shutdown the WebSocket server
   */
  async shutdown() {
    // Disconnect all clients
    this.clients.forEach((client, clientId) => {
      this.disconnect(clientId);
    });
    
    console.log('🔌 WebSocket Server shut down');
  }
}

export default WebSocketServer;
