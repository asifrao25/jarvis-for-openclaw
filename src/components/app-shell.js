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
  if (text.startsWith('[ALERT]')) return 'alert';
  if (text.startsWith('[REPORT]')) return 'report';
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
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      background: #060A12;
      padding-bottom: calc(60px + env(safe-area-inset-bottom, 0));
    }

    header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 0 18px 13px;
      padding-top: max(env(safe-area-inset-top, 44px), 16px);
      background: rgba(6, 10, 18, 0.88);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
      position: relative;
      z-index: 100;
      flex-shrink: 0;
    }
    header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(56, 189, 248, 0.4) 30%,
        rgba(129, 140, 248, 0.5) 60%,
        transparent 100%);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .header-logo {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
      color: white;
      letter-spacing: -0.5px;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.35), 0 2px 8px rgba(0,0,0,0.4);
      flex-shrink: 0;
    }
    .header-title {
      font-size: 17px;
      font-weight: 700;
      color: #F1F5F9;
      letter-spacing: -0.4px;
    }
    .version-tag {
      font-size: 11px;
      font-weight: 600;
      color: #38BDF8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.2);
      padding: 2px 7px;
      border-radius: 6px;
      letter-spacing: 0.2px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #64748B;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      transition: all 0.4s ease;
      flex-shrink: 0;
    }
    .status-dot.connected {
      background: #34D399;
      box-shadow: 0 0 6px rgba(52, 211, 153, 0.7), 0 0 12px rgba(52, 211, 153, 0.3);
    }
    .status-dot.disconnected {
      background: #475569;
      box-shadow: none;
    }

    .content {
      flex: 1;
      overflow: hidden;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .content > * {
      flex: 1;
      min-height: 0;
    }

    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 16px;
      font-size: 13px;
      font-weight: 500;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
    }
    .install-banner {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(129, 140, 248, 0.08));
      color: #94A3B8;
    }
    .push-banner {
      background: rgba(56, 189, 248, 0.06);
      color: #94A3B8;
    }
    .banner-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .btn-sm {
      padding: 7px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      min-height: 34px;
    }
    .btn-sm:active { opacity: 0.8; transform: scale(0.95); }
    .btn-primary {
      background: linear-gradient(135deg, #38BDF8, #818CF8);
      color: white;
      box-shadow: 0 2px 10px rgba(56, 189, 248, 0.3);
    }
    .btn-primary:disabled { opacity: 0.5; transform: none; }
    .btn-ghost {
      background: none;
      color: #475569;
      padding: 7px 10px;
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
    _uiHidden: { type: Boolean, state: true },
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
    this._uiHidden = false;
    this._streamingRuns = new Map();
  }

  connectedCallback() {
    super.connectedCallback();

    if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(() => {});
    }
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage('clear-badge');
    }

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
    if (msg.type === 'res' && msg.ok && msg.payload?.status === 'started') {
      this.thinking = true;
      const lastSending = this.messages.findLastIndex(m => m.role === 'user' && m.status === 'sending');
      if (lastSending !== -1) {
        const updated = [...this.messages];
        updated[lastSending] = { ...updated[lastSending], status: 'received', runId: msg.payload?.runId };
        this.messages = updated;
      }
      return;
    }

    if (msg.type === 'res' && !msg.ok) {
      const lastSending = this.messages.findLastIndex(m => m.role === 'user' && (m.status === 'sending' || m.status === 'received'));
      if (lastSending !== -1) {
        const updated = [...this.messages];
        updated[lastSending] = { ...updated[lastSending], status: 'failed' };
        this.messages = updated;
      }
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
    this._uiHidden = false;
    hapticLight();
  }

  _onUiVisibility(e) { this._uiHidden = e.detail.hidden; }

  _onSendMessage(e) {
    const text = e.detail;
    const requestId = wsClient.sendChat(text);
    const userMsg = {
      role: 'user', text, category: 'chat', timestamp: Date.now(),
      requestId, status: 'sending',
    };
    this.messages = [...this.messages, userMsg];
    addMessage(userMsg).catch(err => console.error('Failed to store message:', err));
    hapticMedium();
  }

  _onRefresh() {
    this._loadStoredMessages();
    hapticMedium();
  }

  async _onDeleteMessage(e) {
    const { id, timestamp } = e.detail;
    this.messages = this.messages.filter(m => {
      if (id && m.id === id) return false;
      if (timestamp && m.timestamp === timestamp && !m.id) return false;
      return true;
    });
    if (id) {
      await deleteMessage(id).catch(err => console.error('Failed to delete message:', err));
    }
    hapticLight();
  }

  async _onClearCategory(e) {
    const category = e.detail;
    if (category === 'chat') {
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
          <button class="btn-sm btn-ghost" @click=${this._dismissInstall}>✕</button>
        </div>
      ` : ''}
      ${this.showPushBanner ? html`
        <div class="banner push-banner">
          <span>Enable push notifications?</span>
          <div class="banner-actions">
            <button class="btn-sm btn-primary" ?disabled=${this.pushLoading} @click=${this._enablePush}>
              ${this.pushLoading ? 'Enabling…' : 'Enable'}
            </button>
            <button class="btn-sm btn-ghost" @click=${this._dismissPush}>✕</button>
          </div>
        </div>
      ` : ''}
      <header>
        <div class="header-left">
          <div class="header-logo">J</div>
          <span class="header-title">Jarvis</span>
          <span class="version-tag">v1.8</span>
        </div>
        <div class="header-right">
          <div class="status-indicator">
            <div class="status-dot ${this.connected ? 'connected' : 'disconnected'}"></div>
            <span>${this.connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </header>
      <div class="content" @delete-message=${this._onDeleteMessage} @clear-category=${this._onClearCategory} @ui-visibility=${this._onUiVisibility}>
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
        .scrollHidden=${this._uiHidden}
        .alertCount=${this.alertCount}
        .reportCount=${this.reportCount}
        @navigate=${this._onNavigate}
      ></nav-bar>
    `;
  }
}

customElements.define('app-shell', AppShell);
