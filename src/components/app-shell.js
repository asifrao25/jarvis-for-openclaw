import { LitElement, html, css } from 'lit';
import { wsClient } from '../services/ws-client.js';
import { getAuth, saveAuth, clearAuth } from '../services/auth.js';
import { registerPush, resyncPush } from '../services/push-registration.js';
import { addMessage, getLatest, deleteMessage, clearByCategory, clearAll } from '../services/message-store.js';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../services/haptics.js';
import './login-screen.js';
import './chat-view.js';
import './alert-view.js';
import './report-view.js';
import './nav-bar.js';

function categorize(text) {
  if (text.includes('[ALERT]')) return 'alert';
  if (text.includes('[REPORT]')) return 'report';
  return 'chat';
}

function extractText(msg) {
  const content = msg.payload?.message?.content || [];
  return content.filter(c => c.type === 'text').map(c => c.text).join('');
}

export class AppShell extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      top: env(safe-area-inset-top, 0);
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      background: #0a0e1a;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      min-height: 52px;
      background: rgba(10, 14, 26, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-logo {
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
    }
    header h1 {
      font-size: 17px;
      font-weight: 600;
      color: #f1f5f9;
      letter-spacing: -0.2px;
    }
    .status {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 500;
      transition: all 0.3s;
    }
    .status.connected {
      background: rgba(34, 197, 94, 0.12);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .status.disconnected {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .content {
      flex: 1;
      overflow: hidden;
    }
    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .install-banner {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
      color: #94a3b8;
    }
    .push-banner {
      background: rgba(59, 130, 246, 0.06);
      color: #94a3b8;
    }
    .banner-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .btn-sm {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: opacity 0.15s, transform 0.1s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      min-height: 36px;
    }
    .btn-sm:active { opacity: 0.8; transform: scale(0.96); }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      transform: none;
    }
    .btn-ghost {
      background: none;
      color: #475569;
      padding: 8px 12px;
      font-size: 16px;
    }

    @media (min-width: 768px) {
      header { padding: 0 24px; min-height: 56px; }
      header h1 { font-size: 18px; }
    }
  `;

  static properties = {
    view: { type: String },
    loggedIn: { type: Boolean },
    connected: { type: Boolean },
    messages: { type: Array },
    thinking: { type: Boolean },
    streaming: { type: Boolean },
    showInstallBanner: { type: Boolean },
    showPushBanner: { type: Boolean },
    pushLoading: { type: Boolean },
    alertCount: { type: Number },
    reportCount: { type: Number },
  };

  constructor() {
    super();
    this.view = 'chat';
    this.loggedIn = false;
    this.connected = false;
    this.messages = [];
    this.thinking = false;
    this.streaming = false;
    this.showInstallBanner = false;
    this.showPushBanner = false;
    this.pushLoading = false;
    this.alertCount = 0;
    this.reportCount = 0;
    this._streamingRuns = new Map();
  }

  connectedCallback() {
    super.connectedCallback();

    // Clear app badge on open
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(() => {});
    }
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage('clear-badge');
    }

    // Clear badge when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (navigator.clearAppBadge) {
          navigator.clearAppBadge().catch(() => {});
        }
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage('clear-badge');
        }
      }
    });

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (!isStandalone) {
      this.showInstallBanner = true;
    }

    if (!localStorage.getItem('openclaw-push-registered') && !localStorage.getItem('openclaw-push-dismissed')) {
      this.showPushBanner = true;
    }

    wsClient.addEventListener('authenticated', async () => {
      this.connected = true;
      const synced = await resyncPush();
      if (!synced && !this.showPushBanner) {
        this.showPushBanner = true;
      }
    });

    wsClient.addEventListener('disconnected', () => {
      this.connected = false;
    });

    wsClient.addEventListener('auth-failed', (e) => {
      this.loggedIn = false;
      clearAuth();
      hapticError();
      const loginEl = this.shadowRoot.querySelector('login-screen');
      if (loginEl) loginEl.setError(e.detail || 'Authentication failed');
    });

    wsClient.addEventListener('message', (e) => {
      this._handleMessage(e.detail);
    });

    const savedPassword = getAuth();
    if (savedPassword) {
      this.loggedIn = true;
      wsClient.connect(savedPassword);
      this._loadStoredMessages();
    }
  }

  async _loadStoredMessages() {
    try {
      const all = await getLatest(200);
      if (all.length > 0) {
        this.messages = all;
      }
    } catch (err) {
      console.error('Failed to load stored messages:', err);
    }
  }

  _handleMessage(msg) {
    // Handle chat.send response — confirms message was received
    if (msg.type === 'res' && msg.ok && msg.payload?.status === 'started') {
      this.thinking = true;
      return;
    }

    if (msg.type !== 'event' || msg.event !== 'chat') return;

    const payload = msg.payload || {};
    const state = payload.state;
    const runId = payload.runId;
    const role = payload.message?.role || 'assistant';
    const text = extractText(msg);
    const category = categorize(text);

    if (state === 'delta') {
      this.thinking = false;
      this.streaming = true;
      const existingIdx = this._streamingRuns.get(runId);

      if (existingIdx !== undefined) {
        const updated = [...this.messages];
        updated[existingIdx] = { ...updated[existingIdx], text, streaming: true };
        this.messages = updated;
      } else {
        const idx = this.messages.length;
        this._streamingRuns.set(runId, idx);
        this.messages = [...this.messages, {
          role, text, category, timestamp: Date.now(), streaming: true, runId,
        }];
      }
    } else if (state === 'final') {
      this.thinking = false;
      this.streaming = false;
      const existingIdx = this._streamingRuns.get(runId);

      const finalMsg = {
        role, text, category, timestamp: Date.now(), streaming: false, runId,
        seq: msg.seq,
      };

      if (existingIdx !== undefined) {
        const updated = [...this.messages];
        updated[existingIdx] = finalMsg;
        this.messages = updated;
        this._streamingRuns.delete(runId);
      } else {
        this.messages = [...this.messages, finalMsg];
      }

      addMessage(finalMsg).catch(err => console.error('Failed to store message:', err));

      if (category === 'alert' && this.view !== 'alert') {
        this.alertCount++;
      } else if (category === 'report' && this.view !== 'report') {
        this.reportCount++;
      }

      hapticLight();
    }
  }

  _onLogin(e) {
    const { password } = e.detail;
    saveAuth(password);
    this.loggedIn = true;
    wsClient.connect(password);
    this._loadStoredMessages();
    hapticSuccess();
  }

  _onNavigate(e) {
    this.view = e.detail;
    if (this.view === 'alert') this.alertCount = 0;
    if (this.view === 'report') this.reportCount = 0;
    hapticLight();
  }

  _onSendMessage(e) {
    const text = e.detail;
    this.messages = [...this.messages, {
      role: 'user', text, category: 'chat', timestamp: Date.now(),
    }];
    addMessage({ role: 'user', text, category: 'chat', timestamp: Date.now() })
      .catch(err => console.error('Failed to store message:', err));
    wsClient.sendChat(text);
    hapticMedium();
  }

  _onRefresh() {
    this._loadStoredMessages();
    hapticMedium();
  }

  async _onDeleteMessage(e) {
    const { id, timestamp } = e.detail;
    // Remove from in-memory list
    this.messages = this.messages.filter(m => {
      if (id && m.id === id) return false;
      if (timestamp && m.timestamp === timestamp && !m.id) return false;
      return true;
    });
    // Remove from IndexedDB if it has an id
    if (id) {
      await deleteMessage(id).catch(err => console.error('Failed to delete message:', err));
    }
    hapticLight();
  }

  async _onClearCategory(e) {
    const category = e.detail;
    if (category === 'chat') {
      // Clear chat + user messages
      this.messages = this.messages.filter(m => m.category !== 'chat' && m.role !== 'user');
      await clearAll().catch(err => console.error('Failed to clear:', err));
    } else {
      this.messages = this.messages.filter(m => m.category !== category);
      await clearByCategory(category).catch(err => console.error('Failed to clear:', err));
    }
    hapticMedium();
  }

  async _enablePush() {
    hapticLight();
    this.pushLoading = true;
    try {
      const ok = await registerPush();
      if (ok) {
        this.showPushBanner = false;
        hapticSuccess();
      } else {
        console.log('[Push] Registration returned false');
        hapticError();
      }
    } catch (err) {
      console.error('[Push] Enable failed:', err);
      hapticError();
    } finally {
      this.pushLoading = false;
    }
  }

  _dismissPush() {
    this.showPushBanner = false;
    localStorage.setItem('openclaw-push-dismissed', 'true');
    hapticLight();
  }

  _dismissInstall() {
    this.showInstallBanner = false;
    hapticLight();
  }

  render() {
    if (!this.loggedIn) {
      return html`<login-screen @login=${this._onLogin}></login-screen>`;
    }

    return html`
      ${this.showInstallBanner ? html`
        <div class="banner install-banner">
          <span>Add to Home Screen for the best experience</span>
          <button class="btn-sm btn-ghost" @click=${this._dismissInstall}>Dismiss</button>
        </div>
      ` : ''}
      ${this.showPushBanner ? html`
        <div class="banner push-banner">
          <span>Enable push notifications?</span>
          <div class="banner-actions">
            <button class="btn-sm btn-primary" ?disabled=${this.pushLoading} @click=${this._enablePush}>
              ${this.pushLoading ? 'Enabling...' : 'Enable'}
            </button>
            <button class="btn-sm btn-ghost" @click=${this._dismissPush}>Dismiss</button>
          </div>
        </div>
      ` : ''}
      <header>
        <div class="header-left">
          <div class="header-logo">J</div>
          <h1>Jarvis</h1>
        </div>
        <span class="status ${this.connected ? 'connected' : 'disconnected'}">
          ${this.connected ? 'Connected' : 'Offline'}
        </span>
      </header>
      <div class="content" @delete-message=${this._onDeleteMessage} @clear-category=${this._onClearCategory}>
        ${this.view === 'chat' ? html`
          <chat-view
            .messages=${this.messages}
            .thinking=${this.thinking}
            .streaming=${this.streaming}
            @send-message=${this._onSendMessage}
            @refresh=${this._onRefresh}
          ></chat-view>
        ` : ''}
        ${this.view === 'alert' ? html`
          <alert-view .messages=${this.messages} @refresh=${this._onRefresh}></alert-view>
        ` : ''}
        ${this.view === 'report' ? html`
          <report-view .messages=${this.messages} @refresh=${this._onRefresh}></report-view>
        ` : ''}
      </div>
      <nav-bar
        .active=${this.view}
        .alertCount=${this.alertCount}
        .reportCount=${this.reportCount}
        @navigate=${this._onNavigate}
      ></nav-bar>
    `;
  }
}

customElements.define('app-shell', AppShell);
