import WebSocket from 'ws';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import config from './config.js';

export default class GatewayClient extends EventEmitter {
  constructor(eventBuffer) {
    super();
    this.eventBuffer = eventBuffer;
    this.ws = null;
    this.connected = false;
    this.authenticated = false;
    this.reconnectTimer = null;
    this.pendingConnectId = null;
  }

  connect() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }

    console.log('[Gateway] Connecting to', config.gatewayUrl);
    this.ws = new WebSocket(config.gatewayUrl, {
      headers: {
        'Origin': 'http://127.0.0.1:18789',
      },
    });

    this.ws.on('open', () => {
      console.log('[Gateway] Connected, waiting for challenge...');
      this.connected = true;
    });

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        this._handleMessage(msg);
      } catch (err) {
        console.error('[Gateway] Parse error:', err.message);
      }
    });

    this.ws.on('close', (code) => {
      console.log('[Gateway] Disconnected code=' + code);
      this.connected = false;
      this.authenticated = false;
      this._scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('[Gateway] Error:', err.message);
    });
  }

  _handleMessage(msg) {
    const preview = msg.type === 'res' && !msg.ok ? JSON.stringify(msg).substring(0, 300) : '';
    console.log(`[Gateway] Recv: type=${msg.type}, event=${msg.event || ''}, method=${msg.method || ''}, id=${msg.id || ''}, ok=${msg.ok} ${preview}`);

    // Handle challenge
    if (msg.type === 'event' && msg.event === 'connect.challenge') {
      console.log('[Gateway] Got challenge, authenticating...');
      this.pendingConnectId = crypto.randomUUID().toUpperCase();

      this.ws.send(JSON.stringify({
        type: 'req',
        id: this.pendingConnectId,
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'openclaw-control-ui',
            version: '1.0.0',
            platform: 'nodejs',
            mode: 'backend',
          },
          auth: { password: config.gatewayPassword },
        },
      }));
      return;
    }

    // Handle connect response
    if (msg.type === 'res' && msg.id === this.pendingConnectId) {
      if (msg.ok) {
        console.log('[Gateway] Authenticated successfully!');
        console.log('[Gateway] Auth payload:', JSON.stringify(msg.payload));
        this.authenticated = true;
        this.emit('authenticated');
      } else {
        console.error('[Gateway] Auth failed:', msg.error?.message || 'unknown');
      }
      return;
    }

    // Buffer and emit all events/responses
    if (msg.type === 'event' || (msg.type === 'res' && msg.id !== this.pendingConnectId)) {
      // Filter out high-frequency noise events from the replay buffer
      const isNoise = msg.type === 'event' && (msg.event === 'tick' || msg.event === 'health');
      
      if (!isNoise) {
        this.eventBuffer.addEvent(msg);
        
        // Log interesting messages
        if (msg.event === 'chat') {
          const text = msg.payload?.message?.content?.[0]?.text || '';
          console.log(`[Gateway] Buffered Chat: seq=${msg.bufferSeq} state=${msg.payload?.state} text="${text.substring(0, 50)}..."`);
        } else {
          console.log(`[Gateway] Buffered ${msg.type}${msg.event ? ':' + msg.event : ''} seq=${msg.bufferSeq}`);
        }
      }

      if (msg.type === 'event') this.emit('event', msg);
      else this.emit('response', msg);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      let payload = typeof data === 'string' ? JSON.parse(data) : data;

      // Intercept chat.send with attachments and transform to gateway-native multimodal format using "agent" method
      if (payload.method === 'chat.send' && payload.params?.attachment) {
        const { message, attachment, sessionKey } = payload.params;
        const content = [];

        // Add text part if present
        if (message) {
          content.push({ type: 'text', text: message });
        }

        // Add media part
        const rawData = attachment.data.replace(/^data:.*?;base64,/, '');
        
        if (attachment.type?.startsWith('image/')) {
          content.push({
            type: 'image',
            data: rawData, 
            name: attachment.name
          });
        } else {
          content.push({
            type: 'file',
            data: rawData,
            name: attachment.name,
            contentType: attachment.type
          });
        }

        // Transform to "agent" method which supports content arrays
        payload.method = 'agent';
        payload.params = {
          sessionKey: sessionKey || 'agent:main:main',
          message: content, // The gateway accepts the array here
          idempotencyKey: crypto.randomUUID()
        };
        
        console.log(`[Gateway] Transformed multimodal to agent.method: text=${!!message} media=${attachment.type}`);
        console.log(`[Gateway] Payload Preview: ${JSON.stringify(content).substring(0, 500)}`);
      }

      const str = JSON.stringify(payload);
      console.log(`[Gateway] Send: ${str.substring(0, 200)}...`);
      this.ws.send(str);
      return true;
    }
    console.log('[Gateway] Send failed: not connected');
    return false;
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log('[Gateway] Reconnecting in 10s...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 10000);
  }

  isReady() {
    return this.connected && this.authenticated;
  }
}
