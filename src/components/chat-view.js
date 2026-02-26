import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight } from '../services/haptics.js';
import './message-item.js';
import './stream-indicator.js';

export class ChatView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      flex: 1;
      min-height: 0;
      position: relative;
      background: transparent;
    }

    .messages {
      flex: 1;
      overflow-y: scroll;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      padding: 15px 20px;
      padding-bottom: 66px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      touch-action: pan-y;
      transition: padding 0.3s ease;
      width: 100%;
      box-sizing: border-box;
    }
    
    :host([ui-hidden]) .messages {
      padding-bottom: 10px;
    }

    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); border-radius: 2px; }

    .input-area-container {
      flex-shrink: 0;
      background: #000;
      border-top: 1px solid rgba(0, 255, 255, 0.15);
      z-index: 30;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      padding-bottom: 22px;
    }

    .input-area {
      padding: 0 50px 0 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      min-height: 44px;
      box-sizing: border-box;
    }

    @media (min-width: 1024px) {
      .input-area-container {
        position: fixed;
        bottom: 80px;
        left: 0;
        right: 0;
        padding: 0 60px;
        background: #000 !important;
        border-top: 1px solid rgba(0, 255, 255, 0.25);
        z-index: 1000;
      }
      .input-area {
        display: flex;
        align-items: center;
        gap: 15px;
        height: 60px;
      }
      .indicator-container {
        bottom: 140px !important;
      }
      .messages {
        padding-bottom: 160px !important;
      }
    }

    :host([ui-hidden]) .input-area-container {
      height: 0;
      min-height: 0;
      opacity: 0;
      pointer-events: none;
      border-top-color: transparent;
    }

    input[type="text"] {
      flex: 1;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0 12px;
      height: 40px;
      color: var(--c-primary);
      font-family: var(--f-body);
      font-size: 16px;
      outline: none;
      -webkit-appearance: none;
      box-sizing: border-box;
      display: block;
      min-width: 0;
    }

    input[type="text"]:focus {
      border-color: var(--c-primary);
      background: rgba(0, 255, 255, 0.1);
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--c-text-dim);
      font-family: var(--f-mono);
      opacity: 0.5;
      padding: 60px 0;
    }
    
    .logo-spin {
      width: 50px; height: 50px;
      border: 2px solid var(--c-primary);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 3s linear infinite;
      margin-bottom: 20px;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }

    .scroll-bottom-btn {
      position: absolute;
      bottom: 78px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 30, 40, 0.9);
      border: 1px solid var(--c-primary-dim);
      color: var(--c-primary);
      border-radius: 20px;
      padding: 6px 14px;
      font-family: var(--f-mono);
      font-size: 10px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      z-index: 40;
      backdrop-filter: blur(15px);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, 15px) scale(0.9);
    }

    .scroll-bottom-btn.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
    }

    .indicator-container {
      position: absolute;
      bottom: 66px;
      left: 0;
      width: 100%;
      z-index: 25;
      pointer-events: none;
    }

    .skeleton-message {
      width: 70%;
      height: 40px;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.1);
      border-radius: 8px;
      margin-bottom: 12px;
      position: relative;
      overflow: hidden;
    }

    .skeleton-message::after {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
      animation: skeleton-sweep 1.5s infinite;
    }

    .refresh-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      color: var(--c-primary);
      font-family: var(--f-mono);
      font-size: 10px;
      letter-spacing: 2px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .refresh-indicator.visible {
      opacity: 0.6;
    }
  `;

  static properties = {
    messages: { type: Array },
    thinking: { type: Boolean },
    streaming: { type: Boolean },
    loading: { type: Boolean },
    uiHidden: { type: Boolean, reflect: true, attribute: 'ui-hidden' },
    _showScrollBtn: { type: Boolean, state: true },
    _isPulling: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.thinking = false;
    this.streaming = false;
    this._touchStartY = 0;
    this.uiHidden = false;
    this._isAutoScrolling = false;
    this._showScrollBtn = false;
    this._isPulling = false;
    this.loading = false;
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.messages');
    setTimeout(() => this.scrollToBottom(false), 50);
    setTimeout(() => this.scrollToBottom(false), 200);

    el.addEventListener('scroll', () => {
      if (this._isAutoScrolling) return;
      const st = el.scrollTop;
      const distFromBottom = el.scrollHeight - st - el.clientHeight;
      this._showScrollBtn = distFromBottom > 300;
    }, { passive: true });

    el.addEventListener('touchstart', (e) => {
      this._touchStartY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - this._touchStartY;
      if (el.scrollTop === 0 && deltaY > 40) {
        this._isPulling = true;
      }
      if (deltaY > 60) {
        const input = this.shadowRoot.querySelector('input[type="text"]');
        if (this.shadowRoot.activeElement === input) {
          input.blur();
          hapticLight();
        }
      }
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      if (this._isPulling) {
        hapticMedium();
        this.dispatchEvent(new CustomEvent('refresh', { bubbles: true, composed: true }));
        this._isPulling = false;
      }
    }, { passive: true });
  }

  updated(changed) {
    if (changed.has('messages')) {
      const oldMessages = changed.get('messages') || [];
      if (this.messages.length > oldMessages.length) {
        this.scrollToBottom(false);
        setTimeout(() => this.scrollToBottom(false), 100);
        setTimeout(() => this.scrollToBottom(false), 300);
      }
    }
    if ((changed.has('thinking') && this.thinking) || (changed.has('streaming') && this.streaming)) {
      this.scrollToBottom(false);
    }
  }

  scrollToBottom(smooth = false) {
    const el = this.shadowRoot.querySelector('.messages');
    if (el) {
      this._isAutoScrolling = true;
      if (smooth) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        el.scrollTop = el.scrollHeight;
      }
      setTimeout(() => { this._isAutoScrolling = false; }, smooth ? 500 : 150);
    }
  }

  async _send(e) {
    e.preventDefault();
    const input = this.shadowRoot.querySelector('input[type="text"]');
    const text = input.value.trim();
    if (!text) return;
    hapticMedium();
    this.dispatchEvent(new CustomEvent('send-message', { detail: { text }, bubbles: true, composed: true }));
    input.value = '';
    setTimeout(() => this.scrollToBottom(true), 100);
  }

  render() {
    return html`
      <div class="messages">
        <div class="refresh-indicator ${this._isPulling ? 'visible' : ''}">
          // SYNCING STREAM...
        </div>

        ${this.loading ? html`
          <div class="skeleton-message" style="width: 60%"></div>
          <div class="skeleton-message" style="width: 85%; align-self: flex-end; background: rgba(0, 153, 255, 0.05);"></div>
          <div class="skeleton-message" style="width: 40%"></div>
          <div class="skeleton-message" style="width: 75%"></div>
        ` : ''}

        ${!this.loading && this.messages.length === 0 ? html`
          <div class="empty-state">
            <div class="logo-spin"></div>
            <div>// JARVIS ONLINE</div>
            <div>WAITING FOR COMMAND</div>
          </div>
        ` : ''}
        
        ${this.messages.map(m => html`
          <message-item 
            .msgId=${m.id} 
            .role=${m.role} 
            .text=${m.text} 
            .timestamp=${m.timestamp}
            .seen=${m.seen}
            .attachment=${m.attachment}
          ></message-item>
        `)}
      </div>

      ${this.thinking ? html`
        <div class="indicator-container">
          <stream-indicator mode="thinking"></stream-indicator>
        </div>
      ` : ''}

      <div class="scroll-bottom-btn ${this._showScrollBtn ? 'visible' : ''}" @click=${() => { hapticMedium(); this.scrollToBottom(true); }}>
        <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        <span>NEW MESSAGES BELOW</span>
      </div>

      <div class="input-area-container">
        <form class="input-area" @submit=${this._send}>
          <input type="text" placeholder="ENTER COMMAND..." autocomplete="off" @focus=${() => {
            this.uiHidden = false;
            this.dispatchEvent(new CustomEvent('ui-toggle', { detail: false, bubbles: true, composed: true }));
          }}>
        </form>
      </div>
    `;
  }
}

customElements.define('chat-view', ChatView);
