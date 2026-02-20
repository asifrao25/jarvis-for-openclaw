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
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
    }

    .app-wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #000;
      min-height: 0;
    }

    .header {
      padding-top: env(safe-area-inset-top, 44px);
      height: calc(var(--s-header-h) + env(safe-area-inset-top, 44px));
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-left: 20px;
      padding-right: 20px;
      border-bottom: 1px solid rgba(0, 255, 255, 0.15);
      background: #000;
      z-index: 50;
      flex-shrink: 0;
      transition: all 0.3s ease;
      overflow: hidden;
    }

    :host([ui-hidden]) .header {
      height: 0;
      padding-top: 0;
      opacity: 0;
      border-bottom: none;
    }

    .header h1 {
      font-family: var(--f-display);
      font-size: 20px;
      letter-spacing: 2px;
      color: var(--c-primary);
      text-shadow: 0 0 10px var(--c-primary-dim);
      margin: 0;
    }

    .header h1 span {
      font-size: 10px;
      vertical-align: middle;
      opacity: 0.5;
      font-family: var(--f-mono);
      margin-left: 5px;
    }

    .status {
      font-family: var(--f-mono);
      font-size: 10px;
      color: var(--c-text-dim);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #333;
      box-shadow: 0 0 5px #333;
    }
    .status-dot.online { background: #00FF00; box-shadow: 0 0 8px #00FF00; }
    .status-dot.connecting { background: #FFFF00; box-shadow: 0 0 8px #FFFF00; }

    .main-view {
      flex: 1;
      position: relative;
      background: radial-gradient(circle at center, #001111 0%, #000000 100%);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .bg-grid {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image:
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }

    .view-container {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      z-index: 1;
      min-height: 0;
    }

    login-screen {
      flex: 1;
    }
  `;

  static properties = {
    view: { type: String },
    loggedIn: { type: Boolean },
    connected: { type: Boolean },
    messages: { type: Array },
    thinking: { type: Boolean },
    streaming: { type: Boolean },
    alertCount: { type: Number },
    reportCount: { type: Number },
    uiHidden: { type: Boolean, reflect: true, attribute: 'ui-hidden' },
    _keyboardOpen: { type: Boolean, reflect: true, attribute: 'keyboard-open' },
  };

  constructor() {
    super();
    this.view = 'chat';
    this.loggedIn = false;
    this.connected = false;
    this.messages = [];
    this.thinking = false;
    this.streaming = false;
    this.alertCount = 0;
    this.reportCount = 0;
    this.uiHidden = false;
    this._keyboardOpen = false;
    this._streamingRuns = new Map();
  }

  connectedCallback() {
    super.connectedCallback();
    this._setupViewport();
    this._setupWebSocket();
    this._checkLogin();

    this.addEventListener('navigate', this._onNavigate);
    this.addEventListener('send-message', this._onSendMessage);
    this.addEventListener('refresh', this._onRefresh);
    this.addEventListener('delete-message', this._onDeleteMessage);
    this.addEventListener('clear-category', this._onClearCategory);
    this.addEventListener('login', this._onLogin);
    this.addEventListener('ui-toggle', (e) => { this.uiHidden = e.detail; });
  }

  _setupViewport() {
    if (window.visualViewport) {
      const handleResize = () => {
        const vv = window.visualViewport;
        const isKeyboard = (window.innerHeight - vv.height) > 150;
        
        if (isKeyboard) {
          this.style.height = `${vv.height}px`;
          this.style.top = `${vv.offsetTop}px`;
        } else {
          this.style.height = '100%';
          this.style.top = '0';
        }
        
        if (isKeyboard !== this._keyboardOpen) {
          this._keyboardOpen = isKeyboard;
          if (isKeyboard) this.uiHidden = false;
          
          if (isKeyboard && this.view === 'chat') {
             setTimeout(() => {
               const chatView = this.shadowRoot.querySelector('chat-view');
               if(chatView) chatView.scrollToBottom();
             }, 100);
          }
        }
      };
      
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      handleResize();
    }
  }

  _setupWebSocket() {
    wsClient.addEventListener('authenticated', async () => {
      this.connected = true;
      await resyncPush();
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
  }

  _checkLogin() {
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
      if (all.length > 0) this.messages = all;
    } catch (err) { console.error('Failed to load stored messages:', err); }
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
        this.messages = [...this.messages, { role, text, category, timestamp: Date.now(), streaming: true, runId }];
      }
    } else if (state === 'final') {
      this.thinking = false;
      this.streaming = false;
      const existingIdx = this._streamingRuns.get(runId);
      const finalMsg = { role, text, category, timestamp: Date.now(), streaming: false, runId, seq: msg.seq };

      if (existingIdx !== undefined) {
        const updated = [...this.messages];
        updated[existingIdx] = finalMsg;
        this.messages = updated;
        this._streamingRuns.delete(runId);
      } else {
        this.messages = [...this.messages, finalMsg];
      }

      addMessage(finalMsg).catch(err => console.error('Failed to store message:', err));

      if (category === 'alert' && this.view !== 'alert') this.alertCount++;
      else if (category === 'report' && this.view !== 'report') this.reportCount++;

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
    this.uiHidden = false;
    hapticLight();
    if (this.view === 'chat') {
      setTimeout(() => {
        const cv = this.shadowRoot.querySelector('chat-view');
        if (cv) cv.scrollToBottom();
      }, 50);
    }
  }

  _onSendMessage(e) {
    const text = e.detail;
    const requestId = wsClient.sendChat(text);
    const userMsg = { role: 'user', text, category: 'chat', timestamp: Date.now(), requestId, status: 'sending' };
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
    if (id) await deleteMessage(id).catch(err => console.error('Failed to delete message:', err));
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

  render() {
    return html`
      <div class="app-wrapper" ?ui-hidden=${this.uiHidden}>
        ${!this.loggedIn ? html`
          <login-screen @login=${this._onLogin}></login-screen>
        ` : html`
          <div class="header">
            <h1>JARVIS <span>v4.4.5</span></h1>
            <div class="status">
              <span>SYSTEM</span>
              <div class="status-dot ${this.connected ? 'online' : 'connecting'}"></div>
            </div>
          </div>

          <div class="main-view">
            <div class="bg-grid"></div>
            <div class="view-container">
              ${this.view === 'chat' ? html`
                <chat-view
                  .messages=${this.messages}
                  .thinking=${this.thinking}
                  .streaming=${this.streaming}
                  .uiHidden=${this.uiHidden}
                ></chat-view>
              ` : ''}
              ${this.view === 'alert' ? html`
                <alert-view .messages=${this.messages}></alert-view>
              ` : ''}
              ${this.view === 'report' ? html`
                <report-view .messages=${this.messages}></report-view>
              ` : ''}
            </div>
          </div>

          <nav-bar
            .active=${this.view}
            .alertCount=${this.alertCount}
            .reportCount=${this.reportCount}
            .uiHidden=${this.uiHidden}
            ?keyboard-open=${this._keyboardOpen}
          ></nav-bar>
        `}
      </div>
    `;
  }
}

customElements.define('app-shell', AppShell);
