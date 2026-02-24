import { LitElement, html, css } from 'lit';
import { wsClient } from '../services/ws-client.js';
import { getAuth, saveAuth, clearAuth } from '../services/auth.js';
import { registerPush, resyncPush } from '../services/push-registration.js';
import { addMessage, getLatest, deleteMessage, markSeen, clearByCategory, clearAll } from '../services/message-store.js';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../services/haptics.js';
import './login-screen.js';
import './chat-view.js';
import './alert-view.js';
import './report-view.js';
import './settings-view.js';
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
      display: block;
      width: 100%;
      height: 100%;
    }

    .app-wrapper {
      display: flex;
      flex-direction: column;
      position: fixed;
      inset: 0;
      width: 100vw;
      background: #000;
      overflow: hidden;
      overflow-x: hidden;
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
    }

    :host([ui-hidden]) .header {
      height: 0;
      padding-top: 0;
      opacity: 0;
      border-bottom: none;
      overflow: hidden;
    }

    .header h1 {
      font-family: var(--f-display);
      font-size: 18px;
      letter-spacing: 2px;
      color: var(--c-primary);
      text-shadow: 0 0 10px var(--c-primary-dim);
      margin: 0;
      flex: 1;
      white-space: nowrap;
    }

    .header h1 span {
      font-size: 10px;
      vertical-align: middle;
      opacity: 0.5;
      font-family: var(--f-mono);
      margin-left: 5px;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .strm-badge {
      font-family: var(--f-mono);
      border: 1px solid rgba(0, 255, 255, 0.4);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      letter-spacing: 1px;
      color: var(--c-primary);
      background: rgba(0, 255, 255, 0.1);
      box-shadow: 0 0 8px rgba(0, 255, 255, 0.2);
    }

    .status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #333;
      box-shadow: 0 0 5px #333;
    }
    .status-dot.online { background: #00FF00; box-shadow: 0 0 8px #00FF00; }
    .status-dot.connecting { background: #FFFF00; box-shadow: 0 0 8px #FFFF00; }

    /* Desktop Enhancements */
    @media (min-width: 1024px) {
      .header {
        height: 60px;
        padding-left: 30px;
        padding-right: 30px;
      }
      .header h1 {
        font-size: 24px;
        letter-spacing: 3px;
      }
      .header h1 span {
        font-size: 12px;
        margin-left: 10px;
      }
      .status {
        gap: 20px;
      }
      .strm-badge {
        font-size: 14px;
        padding: 4px 16px;
        border-width: 1.5px;
        border-radius: 6px;
      }
      .status-dot {
        width: 10px;
        height: 10px;
        box-shadow: 0 0 10px #00FF00;
      }
      .header .status span {
        font-size: 12px !important;
        letter-spacing: 1.5px !important;
      }
    }

    .main-view {
      flex: 1;
      position: relative;
      background: radial-gradient(circle at center, #001111 0%, #000000 100%);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
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

    .view-container.slide-left { animation: slideLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .view-container.slide-right { animation: slideRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

    .swipe-trail {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, transparent, var(--c-primary), transparent);
      box-shadow: 0 0 15px var(--c-primary);
      z-index: 100;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .swipe-trail.active {
      opacity: 0.4;
    }

    @keyframes slideLeft {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideRight {
      from { transform: translateX(-30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
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
    _slideDir: { type: String, state: true },
    _swipeX: { type: Number, state: true },
    _isSwiping: { type: Boolean, state: true },
    _loadingStore: { type: Boolean, state: true },
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
    this._slideDir = '';
    this._swipeX = 0;
    this._isSwiping = false;
    this._loadingStore = true;
    this._streamingRuns = new Map();
    this._touchStart = null;
    this._boundMouseMove = this._handleMouseMove.bind(this);
    this._boundMouseUp = this._handleMouseUp.bind(this);
    this._wheelAccumulator = 0;
    this._wheelTimeout = null;
    this._isNavigating = false;
    this._wheelLatched = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._setupViewport();
    this._setupWebSocket();
    this._checkLogin();
    this._applyGlobalSettings();
    this._handleSharedData();

    this.addEventListener('navigate', this._onNavigate);
    this.addEventListener('send-message', this._onSendMessage);
    this.addEventListener('refresh', this._onRefresh);
    this.addEventListener('delete-message', this._onDeleteMessage);
    this.addEventListener('clear-category', this._onClearCategory);
    this.addEventListener('login', this._onLogin);
    this.addEventListener('logout', this._onLogout);
    this.addEventListener('ui-toggle', (e) => { this.uiHidden = e.detail; });
    this.addEventListener('message-seen', this._onMessageSeen);

    // Clear badge and notifications when app is focused or becomes visible
    window.addEventListener('focus', () => this._clearBadgeAndNotifications());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this._clearBadgeAndNotifications();
      } else {
        wsClient.sendVisibility(false);
      }
    });
    this._clearBadgeAndNotifications();
  }

  _handleSharedData() {
    const url = new URL(window.location.href);
    const text = url.searchParams.get('text');
    const sharedUrl = url.searchParams.get('url');
    
    if (text || sharedUrl) {
      const command = (text || '') + (sharedUrl ? '\n' + sharedUrl : '');
      // Wait for app to be ready/connected before sending
      setTimeout(() => {
        if (this.loggedIn && command.trim()) {
          this._onSendMessage({ detail: command.trim() });
          // Clear URL params without reloading
          window.history.replaceState({}, document.title, '/pwa/');
        }
      }, 1000);
    }
  }


  _clearBadgeAndNotifications() {
    // Report visibility to server for push suppression
    wsClient.sendVisibility(true);

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('clear-badge');
      navigator.serviceWorker.controller.postMessage('clear-notifications');
    }
  }

  _handleTouchStart(e) {
    if (this._keyboardOpen) return;
    this._touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    this._swipeX = e.touches[0].clientX;
  }

  _handleTouchMove(e) {
    if (!this._touchStart) return;
    this._swipeX = e.touches[0].clientX;
    this._isSwiping = true;
  }

  _handleTouchEnd(e) {
    this._isSwiping = false;
    if (!this._touchStart) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - this._touchStart.x;
    const diffY = endY - this._touchStart.y;
    const duration = Date.now() - this._touchStart.time;

    const startX = this._touchStart.x;
    this._touchStart = null;

    // Reject if: too slow (>300ms), too vertical, or starts at screen edges (iOS system gestures)
    if (duration > 300 || Math.abs(diffY) > Math.abs(diffX) || startX < 25 || startX > window.innerWidth - 25) return;

    this._executeSwipe(diffX);
  }

  _handleMouseDown(e) {
    if (this._keyboardOpen) return;
    // Don't trigger if clicking input or buttons
    if (e.target.closest('input, button, select, a')) return;
    
    this._touchStart = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    this._swipeX = e.clientX;
    
    // Add global listeners for mouseup/move to handle dragging outside the element
    window.addEventListener('mousemove', this._boundMouseMove);
    window.addEventListener('mouseup', this._boundMouseUp);
  }

  _handleMouseMove(e) {
    if (!this._touchStart) return;
    this._swipeX = e.clientX;
    this._isSwiping = true;
  }

  _handleMouseUp(e) {
    if (!this._touchStart) return;
    
    const diffX = e.clientX - this._touchStart.x;
    const diffY = e.clientY - this._touchStart.y;
    const duration = Date.now() - this._touchStart.time;

    this._isSwiping = false;
    this._touchStart = null;
    
    window.removeEventListener('mousemove', this._boundMouseMove);
    window.removeEventListener('mouseup', this._boundMouseUp);

    // Desktop/Tab can be a bit more relaxed on duration or verticality if desired
    if (duration > 500 || Math.abs(diffY) > Math.abs(diffX)) return;

    this._executeSwipe(diffX);
  }

  _executeSwipe(diffX) {
    if (this._isNavigating) return;
    const threshold = 60;
    if (Math.abs(diffX) > threshold) {
      const order = ['chat', 'alert', 'report', 'settings'];
      const currentIdx = order.indexOf(this.view);
      
      if (diffX < 0 && currentIdx < order.length - 1) {
        // Swipe Left -> Next Tab (Right)
        this._onNavigate({ detail: order[currentIdx + 1] });
      } else if (diffX > 0 && currentIdx > 0) {
        // Swipe Right -> Prev Tab (Left)
        this._onNavigate({ detail: order[currentIdx - 1] });
      }
    }
  }

  _handleWheel(e) {
    // Completely ignore wheel events while a navigation transition is active
    if (this._isNavigating) {
      this._wheelAccumulator = 0;
      this._wheelLatched = true; // Stay latched during transition
      return;
    }

    // Only handle horizontal swipes
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      this._isSwiping = false;
      return;
    }
    
    // Latch mechanism: if we just navigated, ignore all input until deltaX returns to zero
    // This is the most effective way to kill trackpad inertia.
    if (this._wheelLatched) {
      if (Math.abs(e.deltaX) < 2) {
        this._wheelLatched = false;
      }
      return;
    }

    this._wheelAccumulator += e.deltaX;
    this._isSwiping = true;
    
    // Provide a hint of the swipe trail
    this._swipeX = (window.innerWidth / 2) - (this._wheelAccumulator * 0.5);

    clearTimeout(this._wheelTimeout);
    this._wheelTimeout = setTimeout(() => {
      this._wheelAccumulator = 0;
      this._isSwiping = false;
    }, 150);

    const threshold = 120; // Slightly higher for high-res trackpads
    if (Math.abs(this._wheelAccumulator) > threshold) {
      const dir = this._wheelAccumulator > 0 ? -1 : 1; 
      this._wheelLatched = true; // Lock until fingers stop moving
      this._executeSwipe(dir * 70); 
      this._wheelAccumulator = 0;
      this._isSwiping = false;
    }
  }

  _onMessageSeen(e) {
    const { id, timestamp } = e.detail;
    // Update in-memory state
    this.messages = this.messages.map(m => {
      if ((id && m.id === id) || (timestamp && m.timestamp === timestamp)) {
        return { ...m, seen: true };
      }
      return m;
    });
    // Persist to store if it has an ID
    if (id) markSeen(id);
  }

  _setupViewport() {
    if (window.visualViewport) {
      const handleResize = () => {
        const vv = window.visualViewport;
        const isKeyboard = (window.innerHeight - vv.height) > 150;
        
        if (isKeyboard) {
          const wrapper = this.shadowRoot.querySelector('.app-wrapper');
          if (wrapper) {
            wrapper.style.height = `${vv.height}px`;
            wrapper.style.bottom = 'auto';
          }
        } else {
          const wrapper = this.shadowRoot.querySelector('.app-wrapper');
          if (wrapper) {
            wrapper.style.height = '';
            wrapper.style.bottom = '';
          }
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

    wsClient.addEventListener('buffer-reset', () => {
      console.log('[AppShell] Buffer reset detected, reloading messages...');
      this._loadStoredMessages();
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

  _applyGlobalSettings() {
    const fontSize = localStorage.getItem('settings-font-size') || '16px';
    const userColor = localStorage.getItem('settings-user-color') || '#00FFFF';
    const agentColor = localStorage.getItem('settings-agent-color') || '#E0FFFF';
    
    document.documentElement.style.setProperty('--chat-font-size', fontSize);
    document.documentElement.style.setProperty('--chat-user-color', userColor);
    document.documentElement.style.setProperty('--chat-agent-color', agentColor);
  }

  async _loadStoredMessages() {
    this._loadingStore = true;
    try {
      const all = await getLatest(200);
      if (all.length > 0) {
        // Merge with existing messages (like replayed ones) without duplicating
        const currentIds = new Set(this.messages.map(m => m.id).filter(Boolean));
        const currentSeqs = new Set(this.messages.map(m => m.seq).filter(Boolean));
        const currentReqs = new Set(this.messages.map(m => m.requestId).filter(Boolean));
        
        const newOnes = all.filter(m => 
          (m.id && !currentIds.has(m.id)) || 
          (m.seq && !currentSeqs.has(m.seq)) ||
          (m.requestId && !currentReqs.has(m.requestId)) ||
          (!m.id && !m.seq && !m.requestId)
        );

        if (this.messages.length === 0) {
          this.messages = all;
        } else {
          this.messages = [...newOnes, ...this.messages].sort((a, b) => a.timestamp - b.timestamp);
        }
      }
    } catch (err) { 
      console.error('Failed to load stored messages:', err); 
    } finally {
      setTimeout(() => { this._loadingStore = false; }, 400);
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

    console.log(`[AppShell] Recv Chat: state=${state} runId=${runId} seq=${msg.seq} text="${text.substring(0, 30)}..." replayed=${!!msg._replayed}`);

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
      
      // Deduplicate: check if we already have this message by seq or runId
      const isDuplicate = this.messages.some(m => 
        (msg.seq && m.seq === msg.seq) || 
        (runId && m.runId === runId && !m.streaming)
      );
      if (isDuplicate) {
        console.log(`[AppShell] Ignoring duplicate: seq=${msg.seq} runId=${runId}`);
        return;
      }

      const existingIdx = this._streamingRuns.get(runId);
      const finalMsg = { role, text, category, timestamp: Date.now(), streaming: false, runId, seq: msg.seq, seen: false };

      if (existingIdx !== undefined) {
        const updated = [...this.messages];
        updated[existingIdx] = finalMsg;
        this.messages = updated;
        this._streamingRuns.delete(runId);
      } else {
        this.messages = [...this.messages, finalMsg];
      }

      addMessage(finalMsg).then(id => {
        // If the ID was auto-generated, we might want to update our local object
        // but for now, we'll rely on the timestamp or a re-render.
        // Actually, let's update the message in the list with its new ID if possible.
        if (id) {
           this.messages = this.messages.map(m => m.timestamp === finalMsg.timestamp ? { ...m, id } : m);
        }
      }).catch(err => console.error('Failed to store message:', err));

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

  _onLogout() {
    clearAuth();
    wsClient.disconnect();
    this.loggedIn = false;
    this.messages = [];
    this.view = 'chat';
    hapticMedium();
  }

  _onNavigate(e) {
    const nextView = e.detail;
    if (nextView === this.view || this._isNavigating) return;

    this._isNavigating = true;
    setTimeout(() => { this._isNavigating = false; }, 500);

    const order = ['chat', 'alert', 'report', 'settings'];
    const oldIdx = order.indexOf(this.view);
    const nextIdx = order.indexOf(nextView);

    this._slideDir = nextIdx > oldIdx ? 'slide-left' : 'slide-right';
    this.view = nextView;

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
    const userMsg = { role: 'user', text, category: 'chat', timestamp: Date.now(), requestId, status: 'sending', seen: true };
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
            <h1>JARVIS <span>v4.2.4</span></h1>
            <div class="status">
              <div class="strm-badge">
                STRM: ${this.messages.length.toString().padStart(3, '0')}
              </div>
              <span style="font-size: 9px; letter-spacing: 1px; color: ${this.connected ? 'var(--c-primary)' : 'var(--c-alert)'}; opacity: 0.8;">
                ${this.connected ? 'ONLINE' : (this.loggedIn ? 'CONNECTING' : 'OFFLINE')}
              </span>
              <div class="status-dot ${this.connected ? 'online' : 'connecting'}"></div>
            </div>
          </div>

          ${!this.connected ? html`
            <div style="background: var(--c-alert); color: #fff; font-family: var(--f-mono); font-size: 10px; padding: 4px 10px; text-align: center; letter-spacing: 2px; z-index: 100;">
              // CONNECTION LOST - ATTEMPTING RECONNECT...
            </div>
          ` : ''}

          <div class="main-view" 
               @wheel=${this._handleWheel}
               @mousedown=${this._handleMouseDown}
               @touchstart=${this._handleTouchStart}
               @touchmove=${this._handleTouchMove}
               @touchend=${this._handleTouchEnd}>
            <div class="bg-grid"></div>
            
            <div class="swipe-trail ${this._isSwiping ? 'active' : ''}" 
                 style="left: ${this._swipeX}px;"></div>

            <div class="view-container ${this._slideDir}">
              ${this.view === 'chat' ? html`
                <chat-view
                  .messages=${this.messages}
                  .thinking=${this.thinking}
                  .streaming=${this.streaming}
                  .uiHidden=${this.uiHidden}
                  .loading=${this._loadingStore}
                ></chat-view>
              ` : ''}
              ${this.view === 'alert' ? html`
                <alert-view .messages=${this.messages}></alert-view>
              ` : ''}
              ${this.view === 'report' ? html`
                <report-view .messages=${this.messages}></report-view>
              ` : ''}
              ${this.view === 'settings' ? html`
                <settings-view></settings-view>
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
