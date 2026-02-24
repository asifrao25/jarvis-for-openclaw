// WebSocket client for PWA ↔ Relay communication
export class WSClient extends EventTarget {
  constructor() {
    super();
    this.ws = null;
    this.lastSeq = parseInt(localStorage.getItem('openclaw-lastSeq') || '0', 10);
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.shouldReconnect = true;
    this.connected = false;
    this.authenticated = false;
  }

  connect(password) {
    this.password = password;
    this.shouldReconnect = true;
    this._connect();
  }

  _connect() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }

    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${location.host}/pwa/ws?lastSeq=${this.lastSeq}`;
    console.log('[WS] Connecting to', url);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected, authenticating...');
      this.connected = true;
      this.reconnectDelay = 1000;
      this.ws.send(JSON.stringify({ type: 'auth', password: this.password }));
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        // Auth response
        if (msg.type === 'auth') {
          if (msg.ok) {
            this.authenticated = true;
            this.dispatchEvent(new CustomEvent('authenticated'));
          } else {
            this.dispatchEvent(new CustomEvent('auth-failed', { detail: msg.error }));
            this.shouldReconnect = false;
            this.ws.close();
          }
          return;
        }

        // Buffer reset (server restart)
        if (msg.type === 'buffer-reset') {
          console.log('[WS] Server buffer reset, catching up from 0');
          this.lastSeq = 0;
          localStorage.setItem('openclaw-lastSeq', '0');
          this.dispatchEvent(new CustomEvent('buffer-reset'));
          return;
        }

        // Track seq
        if (typeof msg.seq === 'number') {
          // Detect sequence reset (server restarted)
          if (msg.seq < this.lastSeq - 1000) {
            console.log(`[WS] Sequence reset detected: ${this.lastSeq} -> ${msg.seq}`);
            this.lastSeq = msg.seq;
          } else {
            this.lastSeq = Math.max(this.lastSeq, msg.seq);
          }
          localStorage.setItem('openclaw-lastSeq', String(this.lastSeq));
        }

        // Dispatch event
        this.dispatchEvent(new CustomEvent('message', { detail: msg }));
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.connected = false;
      this.authenticated = false;
      this.dispatchEvent(new CustomEvent('disconnected'));

      if (this.shouldReconnect) {
        console.log(`[WS] Reconnecting in ${this.reconnectDelay}ms...`);
        setTimeout(() => this._connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }

  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }

  sendChat(message, attachment = null, sessionKey = 'agent:main:main') {
    const id = crypto.randomUUID().toUpperCase();
    const params = {
      sessionKey,
      message,
      idempotencyKey: crypto.randomUUID(),
    };
    if (attachment) params.attachment = attachment;

    this.send({
      type: 'req',
      id,
      method: 'chat.send',
      params,
    });
    return id;
  }

  fetchHistory(sessionKey = 'agent:main:main', limit = 50) {
    const id = crypto.randomUUID().toUpperCase();
    this.send({
      type: 'req',
      id,
      method: 'chat.history',
      params: {
        sessionKey,
        limit
      },
    });
    return id;
  }

  sendVisibility(visible) {
    this.send({ type: 'visibility', visible });
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) this.ws.close();
  }
}

export const wsClient = new WSClient();
