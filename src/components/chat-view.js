import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight } from '../services/haptics.js';
import './message-item.js';
import './stream-indicator.js';

export class ChatView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      background: #060A12;
    }

    /* Pull-to-refresh indicator */
    .pull-indicator {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 0;
      overflow: hidden;
      transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
      background: rgba(56, 189, 248, 0.06);
      color: #64748B;
      font-size: 12px;
      font-weight: 500;
      gap: 8px;
    }
    .pull-indicator.pulling { transition: none; }
    .pull-indicator.refreshing { height: 48px; }
    .pull-spinner {
      width: 16px;
      height: 16px;
      border: 1.5px solid rgba(56, 189, 248, 0.2);
      border-top-color: #38BDF8;
      border-radius: 50%;
    }
    .pull-indicator.refreshing .pull-spinner {
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pull-arrow {
      font-size: 14px;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-block;
      opacity: 0.6;
    }
    .pull-arrow.ready { transform: rotate(180deg); }

    .messages {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 8px 0 4px;
      scroll-behavior: smooth;
      overscroll-behavior-y: contain;
    }
    .messages::-webkit-scrollbar { display: none; }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
      padding: 32px;
    }
    .empty-orb {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, rgba(56, 189, 248, 0.25), rgba(129, 140, 248, 0.12) 60%, transparent);
      border: 1px solid rgba(56, 189, 248, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.12), 0 0 60px rgba(129, 140, 248, 0.06);
      animation: orb-pulse 3s ease-in-out infinite;
    }
    @keyframes orb-pulse {
      0%, 100% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.12), 0 0 60px rgba(129, 140, 248, 0.06); }
      50% { box-shadow: 0 0 40px rgba(56, 189, 248, 0.22), 0 0 80px rgba(129, 140, 248, 0.12); }
    }
    .empty-orb svg { width: 30px; height: 30px; }
    .empty-text {
      font-size: 16px;
      font-weight: 600;
      color: #94A3B8;
      letter-spacing: -0.2px;
    }
    .empty-hint {
      font-size: 13px;
      color: #334155;
      text-align: center;
      line-height: 1.5;
    }

    .clear-btn {
      position: absolute;
      top: 10px;
      right: 14px;
      z-index: 10;
      background: none;
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: rgba(239, 68, 68, 0.7);
      font-size: 11px;
      font-weight: 600;
      font-family: inherit;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      transition: all 0.15s;
    }
    .clear-btn:active { opacity: 0.6; transform: scale(0.95); }

    /* Scroll-to-bottom — above input bar */
    .scroll-bottom {
      position: absolute;
      bottom: 82px;
      right: 16px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38BDF8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(56, 189, 248, 0.15);
      z-index: 20;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .scroll-bottom:active { transform: scale(0.88); }
    .scroll-bottom svg { width: 18px; height: 18px; fill: currentColor; }

    /* Input area */
    .input-wrap {
      padding: 10px 14px 14px;
      background: rgba(6, 10, 18, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      max-height: 80px;
      overflow: hidden;
      transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity     0.25s ease;
    }
    .input-wrap.ui-hidden {
      max-height: 0;
      opacity: 0;
      pointer-events: none;
    }
    .scroll-bottom.ui-hidden { bottom: 12px; }
    .input-row {
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }
    input {
      flex: 1;
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 24px;
      color: #F1F5F9;
      font-size: 16px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      min-height: 46px;
    }
    input::placeholder { color: #3D4E63; }
    input:focus {
      border-color: rgba(56, 189, 248, 0.45);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.08);
    }

    .send-btn {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4), 0 2px 4px rgba(0,0,0,0.3);
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .send-btn:active {
      transform: scale(0.88);
      box-shadow: 0 2px 8px rgba(56, 189, 248, 0.3);
    }
    .send-btn:disabled {
      opacity: 0.4;
      transform: none;
      box-shadow: none;
    }
    .send-btn svg {
      width: 20px;
      height: 20px;
      fill: white;
      margin-left: 2px;
    }

    @media (min-width: 768px) {
      .input-wrap {
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
        padding: 10px 20px 14px;
        background: none;
        border-top: none;
      }
    }
  `;

  static properties = {
    messages: { type: Array },
    thinking: { type: Boolean },
    streaming: { type: Boolean },
    _pullState: { type: String, state: true },
    _pullHeight: { type: Number, state: true },
    _showScrollBtn: { type: Boolean, state: true },
    _uiHidden: { type: Boolean, state: true },
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
    this._lastScrollTop = 0;
  }

  updated(changed) {
    if (changed.has('messages')) {
      if (!this._showScrollBtn) {
        this._scrollToBottom();
      }
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
        // Hide only when scrolling UP, past top threshold, and not near bottom
        const shouldHide = delta < 0 && st > 80 && distFromBottom > 80;
        if (shouldHide !== this._uiHidden) {
          this._uiHidden = shouldHide;
          this.dispatchEvent(new CustomEvent('ui-visibility', {
            detail: { hidden: shouldHide },
            bubbles: true,
            composed: true,
          }));
        }
        this._lastScrollTop = Math.max(0, st);
      }
    }, { passive: true });

    el.addEventListener('touchstart', (e) => {
      if (el.scrollTop <= 0) {
        this._touchStartY = e.touches[0].clientY;
        this._pulling = true;
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!this._pulling || this._pullState === 'refreshing') return;
      const dy = e.touches[0].clientY - this._touchStartY;
      if (dy > 0 && el.scrollTop <= 0) {
        const pull = Math.min(dy * 0.5, 80);
        this._pullHeight = pull;
        this._pullState = pull >= 60 ? 'ready' : 'pulling';
        if (pull >= 60 && this._pullState === 'ready') {
          hapticLight();
        }
      } else {
        this._pullHeight = 0;
        this._pullState = 'idle';
      }
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
      } else {
        this._pullState = 'idle';
        this._pullHeight = 0;
      }
    }, { passive: true });
  }

  _scrollToBottom() {
    requestAnimationFrame(() => {
      const el = this.shadowRoot.querySelector('.messages');
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  _onScrollBottom() {
    hapticLight();
    this._scrollToBottom();
  }

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
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                  fill="url(#grad)" opacity="0.8"/>
                <defs>
                  <linearGradient id="grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#38BDF8"/>
                    <stop offset="100%" stop-color="#818CF8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="empty-text">Jarvis is ready</div>
            <div class="empty-hint">Your AI assistant is online and waiting for your message</div>
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
        <button class="scroll-bottom ${this._uiHidden ? 'ui-hidden' : ''}" @click=${this._onScrollBottom} aria-label="Scroll to bottom">
          <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </button>
      ` : ''}

      <form class="input-wrap ${this._uiHidden ? 'ui-hidden' : ''}" @submit=${this._send}>
        <div class="input-row">
          <input type="text" placeholder="Message Jarvis…" autocomplete="off" autocorrect="off" spellcheck="true">
          <button class="send-btn" type="submit">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </form>
    `;
  }
}

customElements.define('chat-view', ChatView);
