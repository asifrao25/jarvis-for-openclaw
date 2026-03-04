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
import LocalHealthChecker from './local-health.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

// Initialize
const eventBuffer = new EventBuffer();
const gatewayClient = new GatewayClient(eventBuffer);
const pushManager = new PushManager();
const localHealth = new LocalHealthChecker(gatewayClient);

// Track connected PWA clients and their visibility
const pwaClients = new Map(); // id -> { ws, isVisible }
const pendingRequests = new Map(); // requestId -> clientId
let runCompleteTimer = null;

// Express app
const app = express();
app.use(express.json());

// API routes
function apiRoutes(router) {
  router.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      gateway: gatewayClient.isReady() ? 'connected' : 'disconnected',
      gatewayMetrics: gatewayClient.getMetrics(),
      pwaClients: pwaClients.size,
      buffer: eventBuffer.getStats(),
      localHealth: localHealth.getVerdict(),
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/api/vapid-public-key', (req, res) => {
    res.json({ publicKey: pushManager.getPublicKey() });
  });

  // Proxy balance fetch to keep API keys secure (client-side removed hardcoded key)
  router.get('/api/balance', async (req, res) => {
    const apiKey = process.env.MOONSHOT_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'MOONSHOT_API_KEY not configured' });
    }
    try {
      const response = await fetch('https://api.moonshot.ai/v1/users/me/balance', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Upstream API error' });
      }
      const data = await response.json();
      res.json({ balance: data?.data?.available_balance });
    } catch (err) {
      console.error('[API] Balance fetch failed:', err.message);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
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

// Serve static files
app.use('/pwa', express.static(distDir));
app.use(express.static(distDir));

// SPA fallback
const spaFallback = (req, res, next) => {
  if (path.extname(req.path) || req.path.startsWith('/api/') || req.path.startsWith('/ws')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
};
app.use('/pwa', spaFallback);
app.use(spaFallback);

// HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ 
  noServer: true,
  maxPayload: 150 * 1024 * 1024 // 150MB limit
});

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
          const stats = eventBuffer.getStats();
          if (lastSeq > stats.newestSeq) {
            console.log(`[WS] ${clientId} lastSeq (${lastSeq}) ahead of buffer (${stats.newestSeq}), triggering client reset`);
            ws.send(JSON.stringify({ type: 'buffer-reset', newestSeq: stats.newestSeq }));
          }

          if (lastSeq > 0 || (lastSeq > stats.newestSeq)) {
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
        pendingRequests.set(msg.id, clientId);
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
    for (const [reqId, cId] of pendingRequests) {
      if (cId === clientId) pendingRequests.delete(reqId);
    }
  });

  ws.on('error', () => {
    pwaClients.delete(clientId);
  });
});

// Ping all PWA clients
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

// Forward events
gatewayClient.on('event', (event) => {
  const enrichedEvent = { ...event };
  if (event.bufferSeq) enrichedEvent.seq = event.bufferSeq;
  const data = JSON.stringify(enrichedEvent);

  let visibleCount = 0;
  for (const [id, client] of pwaClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data);
        if (client.isVisible) visibleCount++;
      } catch {}
    }
  }

  // Handle exec approval requests - also send push notification if no visible clients
  if (event.event === 'exec.approval.requested') {
    console.log(`[Relay] Approval request received: ${event.payload?.approvalId}`);
    if (visibleCount === 0) {
      // App is in background - send push notification
      const { command, agentId, approvalId } = event.payload || {};
      const truncated = command && command.length > 100 ? command.substring(0, 97) + '...' : (command || 'Unknown command');
      pushManager.sendToAll({
        title: 'Jarvis: Approval Required',
        body: `Agent "${agentId}" requests exec: ${truncated}`,
        category: 'approval',
        tag: `approval-${approvalId}`,
        url: '/pwa/',
        requireInteraction: true,
        data: {
          approvalId,
          command,
          agentId,
          category: 'approval',
        },
      });
    }
    return;
  }

  // Agent action events mean the run is still active — cancel pending run.complete
  if (event.event === 'agent') {
    const stream = event.payload?.stream;
    if (stream === 'tool_call' || stream === 'tool_result' || stream === 'subagent' || stream === 'shell' || stream === 'thinking') {
      clearTimeout(runCompleteTimer);
    }
  }

  if (event.event === 'chat') {
    // Cancel any pending run.complete — agent is still active
    clearTimeout(runCompleteTimer);
    if (event.payload?.state === 'final') {
      const runId = event.payload?.runId;
      // 500ms debounce: if no new chat event arrives, broadcast run.complete
      runCompleteTimer = setTimeout(() => {
        console.log(`[Relay] run.complete firing for runId=${runId}`);
        const completeMsg = JSON.stringify({ type: 'event', event: 'run.complete', payload: { runId } });
        for (const [id, client] of pwaClients) {
          if (client.ws.readyState === WebSocket.OPEN) {
            try { client.ws.send(completeMsg); } catch {}
          }
        }
      }, 500);

      // Push notification when app is in background
      if (visibleCount > 0) return;
      const text = extractText(event);
      if (text.trim()) {
        const category = categorize(event);
        const truncated = text.length > 200 ? text.substring(0, 197) + '...' : text;
        const title = category === 'alert' ? 'Jarvis Alert' : (category === 'report' ? 'Jarvis Report' : 'Jarvis');
        pushManager.sendToAll({ title, body: truncated, category, url: '/pwa/' });
      }
    }
  }
});

// Forward responses
gatewayClient.on('response', (msg) => {
  const enrichedMsg = { ...msg };
  if (msg.bufferSeq) enrichedMsg.seq = msg.bufferSeq;
  const data = JSON.stringify(enrichedMsg);

  // If a session reset was successful, we MUST clear the relay buffer
  // so that other clients don't replay old history from us.
  if (msg.method === 'sessions.reset' && msg.ok) {
    console.log('[Relay] Global session reset successful, clearing event buffer');
    eventBuffer.clear();
    // Broadcast buffer-reset to all clients so they align their lastSeq
    const resetMsg = JSON.stringify({ type: 'buffer-reset', newestSeq: 0 });
    for (const [id, client] of pwaClients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(resetMsg);
      }
    }
  }

  const originClientId = pendingRequests.get(msg.id);
  if (originClientId) {
    pendingRequests.delete(msg.id);
    const client = pwaClients.get(originClientId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
      return;
    }
  }

  // Fallback: origin unknown or disconnected — broadcast
  for (const [id, client] of pwaClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try { client.ws.send(data); } catch {}
    }
  }
});

// Start
server.listen(config.port, () => {
  console.log(`[Relay] Server running on port ${config.port}`);
});

gatewayClient.connect();
setTimeout(() => localHealth.start(), 5000); // allow gateway connection to begin

// Graceful shutdown
const shutdown = () => {
  console.log('[Relay] Shutting down...');
  clearInterval(pingInterval);
  localHealth.stop();
  server.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
