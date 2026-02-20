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
      top: 0; left: 0; right: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #030507;
      /* Force GPU compositing layer — fixes WebKit fixed-position rendering glitch on iOS */
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      overflow: hidden;
    }

    /* ── Background layer ── */
    .bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .bg-grid {
      position: absolute;
      inset: -40px;
      background-image:
        linear-gradient(rgba(0,255,238,.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,238,.025) 1px, transparent 1px);
      background-size: 44px 44px;
    }
    .bg-scanlines {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent, transparent 3px,
        rgba(0,0,0,.07) 3px, rgba(0,0,0,.07) 4px
      );
    }
    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(110px);
      animation: drift 10s ease-in-out infinite alternate;
    }
    .bg-orb-1 {
      width: 580px; height: 580px;
      background: radial-gradient(circle, rgba(0,255,238,.10) 0%, transparent 70%);
      top: -260px; right: -180px;
    }
    .bg-orb-2 {
      width: 380px; height: 380px;
      background: radial-gradient(circle, rgba(255,140,66,.06) 0%, transparent 70%);
      bottom: 80px; left: -120px;
      animation-duration: 14s;
      animation-direction: alternate-reverse;
    }
    .bg-orb-3 {
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(0,255,238,.05) 0%, transparent 70%);
      bottom: 40%; right: 8%;
      animation-duration: 18s;
    }
    @keyframes drift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(25px, 35px) scale(1.08); }
    }

    /* ── Boot screen ── */
    .boot {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: #030507;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 28px;
      transition: opacity .55s ease .1s;
      pointer-events: all;
    }
    .boot.hidden { opacity: 0; pointer-events: none; }
    .boot-logo {
      font-family: 'Orbitron', monospace;
      font-weight: 900;
      font-size: clamp(28px, 8vw, 40px);
      letter-spacing: .35em;
      color: #00ffee;
      text-shadow: 0 0 40px rgba(0,255,238,.6), 0 0 90px rgba(0,255,238,.2);
      animation: bootRise .6s cubic-bezier(.16,1,.3,1) both;
    }
    .boot-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: .2em;
      color: #d4eaf5;
      text-transform: uppercase;
      animation: bootRise .5s .15s cubic-bezier(.16,1,.3,1) both;
    }
    .boot-track {
      width: 180px; height: 1px;
      background: rgba(0,255,238,.15);
      border-radius: 1px;
      overflow: hidden;
      animation: bootRise .5s .2s both;
    }
    .boot-fill {
      height: 100%;
      background: linear-gradient(90deg, #00ffee, rgba(0,255,238,.5));
      box-shadow: 0 0 12px #00ffee;
      width: 0%;
      animation: bootFill 2.2s .3s cubic-bezier(.4,0,.2,1) forwards;
    }
    @keyframes bootRise {
      from { opacity: 0; transform: translateY(14px) scale(.93); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes bootFill {
      0%   { width: 0% }
      30%  { width: 42% }
      65%  { width: 74% }
      88%  { width: 92% }
      100% { width: 100% }
    }

    /* Content area */
    .content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      z-index: 1;
      padding-top: env(safe-area-inset-top, 0px);
    }
  `;

  static properties = {
    view:             { type: String },
    loggedIn:         { type: Boolean },
    connected:        { type: Boolean },
    messages:         { type: Array },
    thinking:         { type: Boolean },
    streaming:        { type: Boolean },
    showInstallBanner:{ type: Boolean },
    showPushBanner:   { type: Boolean },
    pushLoading:      { type: Boolean },
    alertCount:       { type: Number },
    reportCount:      { type: Number },
    _uiHidden:        { type: Boolean, state: true },
    _kbOpen:          { type: Boolean, state: true },
    _wsStatus:        { type: String,  state: true },
    _booting:         { type: Boolean, state: true },
    _bootHidden:      { type: Boolean, state: true },
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
    this._kbOpen = false;
    this._wsStatus = 'offline';
    this._streamingRuns = new Map();
    this._booting = true;
    this._bootHidden = false;
  }

  connectedCallback() {
    super.connectedCallback();

    // Boot animation
    setTimeout(() => { this._bootHidden = true; }, 2400);
    setTimeout(() => { this._booting = false; }, 3100);

    if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage('clear-badge');
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage('clear-badge');
        }
      }
    });

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (!isStandalone) this.showInstallBanner = true;

    if (!localStorage.getItem('openclaw-push-registered') && !localStorage.getItem('openclaw-push-dismissed')) {
      this.showPushBanner = true;
    }

    wsClient.addEventListener('authenticated', async () => {
      this.connected = true;
      this._wsStatus = 'online';
      const synced = await resyncPush();
      if (!synced && !this.showPushBanner) this.showPushBanner = true;
    });

    wsClient.addEventListener('disconnected', () => {
      this.connected = false;
      this._wsStatus = 'connecting';
    });


    wsClient.addEventListener('auth-failed', (e) => {
      this.loggedIn = false;
      clearAuth();
      hapticError();
      const loginEl = this.shadowRoot.querySelector('login-screen');
      if (loginEl) loginEl.setError(e.detail || 'Authentication failed');
    });

    wsClient.addEventListener('message', (e) => { this._handleMessage(e.detail); });

    if (window.visualViewport) {
      const onVvResize = () => {
        const vv = window.visualViewport;
        this.style.height = `${vv.height}px`;
        this.style.top = `${vv.offsetTop}px`;

        // Check if keyboard is likely open based on viewport height reduction
        const isKbOpen = (window.innerHeight - vv.height) > 150;
        if (isKbOpen !== this._kbOpen) {
          if (isKbOpen) this._onKbOpen();
          else this._onKbClose();
        }
      };
      window.visualViewport.addEventListener('resize', onVvResize);
      window.visualViewport.addEventListener('scroll', onVvResize);
      onVvResize();
    }

    const savedPassword = getAuth();
    if (savedPassword) {
      this.loggedIn = true;
      this._wsStatus = 'connecting';
      wsClient.connect(savedPassword);
      this._loadStoredMessages();
    }
  }

  disconnectedCallback() { super.disconnectedCallback(); }

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
    this._wsStatus = 'connecting';
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

  _onKbOpen() {
    clearTimeout(this._kbCloseTimer);
    this._kbOpen = true;
    const cv = this.shadowRoot?.querySelector('chat-view');
    if (cv) cv.setAttribute('kb-open', '');
  }

  _onKbClose() {
    this._kbOpen = false;
    this._kbCloseTimer = setTimeout(() => {
      const cv = this.shadowRoot?.querySelector('chat-view');
      if (cv) cv.removeAttribute('kb-open');
    }, 350);
  }

  _onSendMessage(e) {
    const text = e.detail;
    const requestId = wsClient.sendChat(text);
    const userMsg = { role: 'user', text, category: 'chat', timestamp: Date.now(), requestId, status: 'sending' };
    this.messages = [...this.messages, userMsg];
    addMessage(userMsg).catch(err => console.error('Failed to store message:', err));
    hapticMedium();
  }

  _onRefresh() { this._loadStoredMessages(); hapticMedium(); }

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

  async _enablePush() {
    hapticLight();
    this.pushLoading = true;
    try {
      const ok = await registerPush();
      if (ok) { this.showPushBanner = false; hapticSuccess(); }
      else hapticError();
    } catch (err) { console.error('[Push] Enable failed:', err); hapticError(); }
    finally { this.pushLoading = false; }
  }

  _dismissPush() {
    this.showPushBanner = false;
    localStorage.setItem('openclaw-push-dismissed', 'true');
    hapticLight();
  }

  _dismissInstall() { this.showInstallBanner = false; hapticLight(); }

  _clearChat() {
    hapticMedium();
    this._onClearCategory({ detail: 'chat' });
  }

  render() {
    const bg = html`
      <div class="bg" aria-hidden="true">
        <div class="bg-grid"></div>
        <div class="bg-scanlines"></div>
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
      </div>
    `;

    if (!this.loggedIn) {
      return html`
        ${bg}
        <login-screen @login=${this._onLogin}></login-screen>
      `;
    }

    return html`
      ${this._booting ? html`
        <div class="boot${this._bootHidden ? ' hidden' : ''}">
          <div class="boot-logo">JARVIS</div>
          <div class="boot-sub">Neural Interface v4.0</div>
          <div class="boot-track"><div class="boot-fill"></div></div>
        </div>
      ` : ''}

      ${bg}

      <div class="content"
        @delete-message=${this._onDeleteMessage}
        @clear-category=${this._onClearCategory}
        @ui-visibility=${this._onUiVisibility}>
        <chat-view
          .messages=${this.messages}
          .thinking=${this.thinking}
          .streaming=${this.streaming}
          @send-message=${this._onSendMessage}
          @refresh=${this._onRefresh}
        ></chat-view>
      </div>
    `;
  }
}

customElements.define('app-shell', AppShell);
