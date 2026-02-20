import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight } from '../services/haptics.js';
import './message-item.js';
import './stream-indicator.js';

export class ChatView extends LitElement {
  static styles = css`
    :host {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    /* Pull-to-refresh indicator */
    .pull-indicator {
      position: absolute;
      top: 0; left: 0; right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 0;
      overflow: hidden;
      transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
      color: #4a6e82;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: .08em;
      gap: 8px;
    }
    .pull-indicator.pulling { transition: none; }
    .pull-indicator.refreshing { height: 48px; }
    .pull-spinner {
      width: 14px; height: 14px;
      border: 1.5px solid rgba(0,255,238,.18);
      border-top-color: #00ffee;
      border-radius: 50%;
    }
    .pull-indicator.refreshing .pull-spinner { animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pull-arrow { font-size: 13px; opacity: 0.5; transition: transform .2s; }
    .pull-arrow.ready { transform: rotate(180deg); }

    /* Header bar */
    .cv-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 14px;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(0,255,238,.08);
      background: rgba(3,5,7,.6);
    }
    .cv-header-title {
      font-family: 'Orbitron', monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .25em;
      color: #00ffee;
      text-transform: uppercase;
    }
    .cv-header-ver {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: .1em;
      color: #4a6e82;
    }

    /* Messages area */
    .messages {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 12px 0 8px;
      overscroll-behavior-y: contain;
    }
    .messages::-webkit-scrollbar { display: none; }

    /* Empty state */
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 14px;
      padding: 32px;
    }
    .empty-orb {
      width: 64px; height: 64px;
      border-radius: 50%;
      border: 1px solid rgba(0,255,238,.18);
      background: rgba(0,255,238,.04);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 24px rgba(0,255,238,.08);
      animation: orbBreath 4s ease-in-out infinite;
    }
    @keyframes orbBreath {
      0%, 100% { box-shadow: 0 0 20px rgba(0,255,238,.08); }
      50%       { box-shadow: 0 0 36px rgba(0,255,238,.16); }
    }
    .empty-orb svg { width: 28px; height: 28px; }
    .empty-text {
      font-family: 'Orbitron', monospace;
      font-size: 12px;
      font-weight: 700;
      color: #4a6e82;
      letter-spacing: .2em;
      text-transform: uppercase;
    }
    .empty-hint {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #2a3f50;
      text-align: center;
      letter-spacing: .03em;
      line-height: 1.6;
    }

    /* Clear all button */
    .clear-btn {
      position: absolute;
      top: 10px; right: 14px;
      z-index: 10;
      background: transparent;
      border: 1px solid rgba(0,255,238,.14);
      color: #4a6e82;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      transition: all .2s;
    }
    .clear-btn:active {
      color: #FF4D6D;
      border-color: rgba(255,77,109,.3);
      background: rgba(255,77,109,.06);
    }

    /* Scroll-to-bottom */
    .scroll-bottom {
      position: absolute;
      bottom: 80px; right: 16px;
      width: 34px; height: 34px;
      border-radius: 50%;
      background: rgba(8,13,20,.92);
      border: 1px solid rgba(0,255,238,.18);
      color: #00ffee;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 20;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      box-shadow: 0 0 12px rgba(0,255,238,.12);
      transition: all .2s;
    }
    .scroll-bottom:active { opacity: 0.7; transform: scale(.9); }
    .scroll-bottom svg { width: 16px; height: 16px; fill: currentColor; }

    /* Input bar */
    .input-wrap {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 10px 14px;
      padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
      background: rgba(3,5,7,.94);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-top: 1px solid rgba(0,255,238,.10);
      flex-shrink: 0;
      position: relative;
    }
    .input-wrap::before {
      content: '';
      position: absolute;
      top: -1px; left: 15%; right: 15%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,255,238,.35), transparent);
    }
    :host([kb-open]) .input-wrap { padding-bottom: 10px; }

    .attach-btn {
      width: 40px; height: 42px;
      border: 1px solid rgba(0,255,238,.12);
      background: transparent;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4a6e82;
      cursor: pointer;
      flex-shrink: 0;
      transition: all .2s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      padding: 0;
    }
    .attach-btn:active {
      color: #00ffee;
      border-color: rgba(0,255,238,.28);
      background: rgba(0,255,238,.08);
      transform: scale(.9);
    }
    .attach-btn svg { width: 16px; height: 16px; }

    .input-field-wrap { flex: 1; }

    input {
      width: 100%;
      height: 42px;
      padding: 0 14px;
      background: #0d1520;
      border: 1px solid rgba(0,255,238,.12);
      border-radius: 14px;
      color: #d4eaf5;
      font-size: 15px;
      font-family: 'Syne', sans-serif;
      outline: none;
      caret-color: #00ffee;
      display: block;
      transition: border-color .2s, box-shadow .2s;
      -webkit-appearance: none;
    }
    input::placeholder {
      color: #2a3f50;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      letter-spacing: .04em;
    }
    input:focus {
      border-color: rgba(0,255,238,.28);
      box-shadow: 0 0 0 3px rgba(0,255,238,.05);
    }

    .send-btn {
      width: 42px; height: 42px;
      border: none;
      background: linear-gradient(135deg, #00ffee, #00c8b8);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #030507;
      cursor: pointer;
      flex-shrink: 0;
      transition: all .18s;
      box-shadow: 0 4px 16px rgba(0,255,238,.22);
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .send-btn:active {
      transform: scale(.88);
      box-shadow: 0 2px 8px rgba(0,255,238,.15);
    }
    .send-btn:disabled { opacity: .25; box-shadow: none; }
    .send-btn svg { width: 17px; height: 17px; fill: currentColor; }
  `;

  static properties = {
    messages:       { type: Array },
    thinking:       { type: Boolean },
    streaming:      { type: Boolean },
    _pullState:     { type: String,  state: true },
    _pullHeight:    { type: Number,  state: true },
    _showScrollBtn: { type: Boolean, state: true },
    _uiHidden:      { type: Boolean, state: true },
    _kbFocused:     { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.messages = [];
    this.thinking = false;
    this.streaming = false;
    this._pullState = 'idle';
    this._pullHeight = 0;
    this._touchStartY = 0;
    this._pulling = false;
    this._showScrollBtn = false;
    this._uiHidden = false;
    this._kbFocused = false;
    this._lastScrollTop = 0;
  }

  updated(changed) {
    if (changed.has('messages') && !this._showScrollBtn) {
      this._scrollToBottom();
    }
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.messages');
    if (!el) return;

    el.addEventListener('scroll', () => {
      const st = el.scrollTop;
      const distFromBottom = el.scrollHeight - st - el.clientHeight;
      this._showScrollBtn = distFromBottom > 150;

      const delta = st - this._lastScrollTop;
      if (Math.abs(delta) > 5) {
        const shouldHide = delta < 0 && st > 80 && distFromBottom > 80;
        if (shouldHide !== this._uiHidden) {
          this._uiHidden = shouldHide;
          this.dispatchEvent(new CustomEvent('ui-visibility', {
            detail: { hidden: shouldHide },
            bubbles: true, composed: true,
          }));
        }
        this._lastScrollTop = Math.max(0, st);
      }
    }, { passive: true });

    el.addEventListener('touchstart', (e) => {
      if (el.scrollTop <= 0) { this._touchStartY = e.touches[0].clientY; this._pulling = true; }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!this._pulling || this._pullState === 'refreshing') return;
      const dy = e.touches[0].clientY - this._touchStartY;
      if (dy > 0 && el.scrollTop <= 0) {
        const pull = Math.min(dy * 0.5, 80);
        this._pullHeight = pull;
        this._pullState = pull >= 60 ? 'ready' : 'pulling';
        if (pull >= 60 && this._pullState === 'ready') hapticLight();
      } else { this._pullHeight = 0; this._pullState = 'idle'; }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      if (!this._pulling) return;
      this._pulling = false;
      if (this._pullState === 'ready') {
        this._pullState = 'refreshing';
        this._pullHeight = 0;
        hapticMedium();
        this.dispatchEvent(new CustomEvent('refresh'));
        setTimeout(() => { this._pullState = 'idle'; }, 1000);
      } else { this._pullState = 'idle'; this._pullHeight = 0; }
    }, { passive: true });

    const input = this.shadowRoot.querySelector('input');
    if (input) {
      input.addEventListener('blur', () => {
        this._kbFocused = false;
        setTimeout(() => window.scrollTo(0, 0), 30);
      });

      el.addEventListener('touchstart', () => {
        if (this.shadowRoot.activeElement === input) input.blur();
      }, { passive: true });
    }
  }

  _scrollToBottom() {
    requestAnimationFrame(() => {
      const el = this.shadowRoot.querySelector('.messages');
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  _onScrollBottom() { hapticLight(); this._scrollToBottom(); }

  _send(e) {
    e.preventDefault();
    const input = this.shadowRoot.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    hapticMedium();
    this.dispatchEvent(new CustomEvent('send-message', { detail: text }));
  }

  _clearAll() {
    hapticMedium();
    this.dispatchEvent(new CustomEvent('clear-category', { detail: 'chat', bubbles: true, composed: true }));
  }

  render() {
    const chatMessages = this.messages.filter(m => m.category === 'chat' || m.role === 'user');

    const pullClasses = ['pull-indicator'];
    if (this._pullState === 'pulling' || this._pullState === 'ready') pullClasses.push('pulling');
    if (this._pullState === 'refreshing') pullClasses.push('refreshing');
    const pullStyle = (this._pullState === 'pulling' || this._pullState === 'ready')
      ? `height: ${this._pullHeight}px` : '';

    return html`
      <div class="cv-header">
        <span class="cv-header-title">Jarvis</span>
        <span class="cv-header-ver">v4.0</span>
      </div>

      <div class=${pullClasses.join(' ')} style=${pullStyle}>
        ${this._pullState === 'refreshing' ? html`
          <div class="pull-spinner"></div>
          <span>Refreshing</span>
        ` : html`
          <span class="pull-arrow ${this._pullState === 'ready' ? 'ready' : ''}">↓</span>
          <span>${this._pullState === 'ready' ? 'Release to refresh' : 'Pull to refresh'}</span>
        `}
      </div>

      ${chatMessages.length > 0 ? html`
        <button class="clear-btn" @click=${this._clearAll}>Clear All</button>
      ` : ''}

      <div class="messages">
        ${chatMessages.length === 0 ? html`
          <div class="empty">
            <div class="empty-orb">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="rgba(0,255,238,0.4)" stroke-width="1"/>
                <circle cx="12" cy="12" r="3" fill="#00ffee" opacity="0.8"/>
                <line x1="12" y1="2"  x2="12" y2="5"  stroke="rgba(0,255,238,0.5)" stroke-width="1"/>
                <line x1="12" y1="19" x2="12" y2="22" stroke="rgba(0,255,238,0.5)" stroke-width="1"/>
                <line x1="2"  y1="12" x2="5"  y2="12" stroke="rgba(0,255,238,0.5)" stroke-width="1"/>
                <line x1="19" y1="12" x2="22" y2="12" stroke="rgba(0,255,238,0.5)" stroke-width="1"/>
              </svg>
            </div>
            <div class="empty-text">Jarvis Online</div>
            <div class="empty-hint">// neural link established\nwaiting for your input</div>
          </div>
        ` : ''}
        ${chatMessages.map(m => html`
          <message-item
            .role=${m.role}
            .text=${m.text}
            .timestamp=${m.timestamp}
            .category=${m.category}
            .streaming=${m.streaming || false}
            .msgId=${m.id || null}
            .status=${m.status || null}
          ></message-item>
        `)}
        ${this.thinking ? html`<stream-indicator mode="thinking"></stream-indicator>` : ''}
        ${this.streaming && !this.thinking ? html`<stream-indicator mode="streaming"></stream-indicator>` : ''}
      </div>

      ${this._showScrollBtn ? html`
        <button class="scroll-bottom" @click=${this._onScrollBottom} aria-label="Scroll to bottom">
          <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </button>
      ` : ''}

      <form class="input-wrap" @submit=${this._send}>
        <button type="button" class="attach-btn" aria-label="Attach">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <div class="input-field-wrap">
          <input type="text" placeholder="// message jarvis…" autocomplete="off" autocorrect="off" spellcheck="true">
        </div>
        <button class="send-btn" type="submit" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    `;
  }
}

customElements.define('chat-view', ChatView);
