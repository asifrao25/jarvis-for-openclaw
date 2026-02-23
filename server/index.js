import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import EventBuffer from './event-buffer.js';
import GatewayClient from './gateway-client.js';
import PushManager from './push-manager.js';
import { categorize, extractText } from './category-filter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

// Initialize
const eventBuffer = new EventBuffer();
const gatewayClient = new GatewayClient(eventBuffer);
const pushManager = new PushManager();

// Track connected PWA clients and their visibility
const pwaClients = new Map(); // id -> { ws, isVisible }

// Express app
const app = express();
app.use(express.json());

// Serve static files at both /pwa/ (direct access) and / (via Tailscale --set-path /pwa)
app.use('/pwa', express.static(distDir));
app.use(express.static(distDir));

// API routes — mount at both /pwa/api and /api for Tailscale path stripping
function apiRoutes(router) {
  router.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      gateway: gatewayClient.isReady() ? 'connected' : 'disconnected',
      pwaClients: pwaClients.size,
      buffer: eventBuffer.getStats(),
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/api/vapid-public-key', (req, res) => {
    res.json({ publicKey: pushManager.getPublicKey() });
  });

  router.post('/api/push/subscribe', (req, res) => {
    const { clientId, subscription } = req.body;
    if (!clientId || !subscription?.endpoint) {
      return res.status(400).json({ error: 'Missing clientId or subscription' });
    }
    pushManager.registerSubscription(clientId, subscription);
    res.json({ ok: true });
  });
}

apiRoutes(app);
const pwaRouter = express.Router();
apiRoutes(pwaRouter);
app.use('/pwa', pwaRouter);

// SPA fallback for both /pwa/* and /*
const spaFallback = (req, res, next) => {
  if (path.extname(req.path) || req.path.startsWith('/api/') || req.path.startsWith('/ws')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
};
app.use('/pwa', spaFallback);
app.use(spaFallback);

// HTTP server
const server = createServer(app);

// WebSocket server — accept at both /pwa/ws and /ws
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/pwa/ws' || pathname === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const lastSeq = parseInt(url.searchParams.get('lastSeq') || '0', 10);
  const clientId = `pwa-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  console.log(`[WS] New connection: ${clientId}, lastSeq: ${lastSeq}`);

  let authenticated = false;
  ws.isAlive = true;
  let isVisible = true; // Assume visible on connect

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (data) => {
    ws.isAlive = true;
    try {
      const msg = JSON.parse(data.toString());

      // Visibility update
      if (msg.type === 'visibility') {
        isVisible = msg.visible;
        if (authenticated) {
          pwaClients.set(clientId, { ws, isVisible });
        }
        return;
      }

      // Auth: client sends { type: "auth", password: "..." }
      if (msg.type === 'auth') {
        if (msg.password === config.gatewayPassword) {
          authenticated = true;
          pwaClients.set(clientId, { ws, isVisible });
          ws.send(JSON.stringify({ type: 'auth', ok: true }));
          console.log(`[WS] ${clientId} authenticated`);

          // Replay missed events
          if (lastSeq > 0) {
            const missed = eventBuffer.getEventsSince(lastSeq, clientId);
            console.log(`[WS] Replaying ${missed.length} events for ${clientId}`);
            for (const event of missed) {
              ws.send(JSON.stringify({
                type: event.type,
                event: event.event,
                seq: event.bufferSeq, // Use stable bufferSeq for PWA clients
                payload: event.payload,
                _replayed: true,
              }));
            }
          }
        } else {
          ws.send(JSON.stringify({ type: 'auth', ok: false, error: 'Invalid password' }));
          ws.close();
        }
        return;
      }

      if (!authenticated) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
        return;
      }

      // Forward requests to gateway (chat.send, etc.)
      if (msg.type === 'req') {
        console.log(`[WS] ${clientId} forwarding req: method=${msg.method}, id=${msg.id}`);
        const sent = gatewayClient.send(msg);
        console.log(`[WS] Forward result: ${sent}`);
      }
    } catch (err) {
      console.error(`[WS] ${clientId} message error:`, err.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] ${clientId} disconnected`);
    pwaClients.delete(clientId);
    eventBuffer.clearRateLimit(clientId);
  });

  ws.on('error', () => {
    pwaClients.delete(clientId);
  });
});

// Ping all PWA clients every 15s, kill dead connections after 20s
const pingInterval = setInterval(() => {
  for (const [id, client] of pwaClients) {
    if (!client.ws.isAlive) {
      console.log(`[WS] ${id} dead (no pong), terminating`);
      pwaClients.delete(id);
      client.ws.terminate();
      continue;
    }
    client.ws.isAlive = false;
    client.ws.ping();
  }
}, 15000);

// Forward gateway events to all PWA clients
gatewayClient.on('event', (event) => {
  // Use the internal bufferSeq for PWA client sync
  const enrichedEvent = { ...event };
  if (event.bufferSeq) enrichedEvent.seq = event.bufferSeq;
  const data = JSON.stringify(enrichedEvent);

  // Forward to connected clients, count active ones
  let activeCount = 0;
  let visibleCount = 0;

  for (const [id, client] of pwaClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data);
        activeCount++;
        if (client.isVisible) visibleCount++;
      } catch {
        // Send failed, connection is dead
      }
    }
  }

  // Send push for final chat messages if no visible clients are currently connected
  if (event.event === 'chat' && event.payload?.state === 'final') {
    // Only suppress if a client is explicitly VISIBLE. 
    // Having an active socket while hidden (common on iOS) should not block notifications.
    if (visibleCount > 0) {
      console.log(`[Push] Suppressing. Visible clients: ${visibleCount}`);
      return;
    }

    const text = extractText(event);
    if (text.trim()) {
      const category = categorize(event);
      const truncated = text.length > 200 ? text.substring(0, 197) + '...' : text;
      let title = 'Jarvis';
      if (category === 'alert') title = 'Jarvis Alert';
      else if (category === 'report') title = 'Jarvis Report';

      console.log(`[Push] No alive clients, sending push: ${title} — ${truncated.substring(0, 50)}`);
      pushManager.sendToAll({
        title,
        body: truncated,
        category,
        url: '/pwa/',
      });
    }
  }
});

// Forward gateway responses (e.g. chat.send results) to PWA clients
gatewayClient.on('response', (msg) => {
  const data = JSON.stringify(msg);
  for (const [id, client] of pwaClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
});

// Start
server.listen(config.port, () => {
  console.log(`[Relay] Server running on port ${config.port}`);
  console.log(`[Relay] PWA served at /pwa/ and /`);
  console.log(`[Relay] WebSocket at /pwa/ws and /ws`);
  console.log(`[Relay] Health at /pwa/api/health and /api/health`);
});

gatewayClient.connect();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Relay] Shutting down...');
  clearInterval(pingInterval);
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Relay] Shutting down...');
  clearInterval(pingInterval);
  server.close();
  process.exit(0);
});

// Log stats periodically
setInterval(() => {
  const stats = eventBuffer.getStats();
  console.log(`[Relay] Buffer: ${stats.totalEvents} events, clients: ${pwaClients.size}, gateway: ${gatewayClient.isReady() ? 'ok' : 'disconnected'}`);
}, 300000);
