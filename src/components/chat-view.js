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
      transition: height 0.2s ease;
      z-index: 10;
      background: rgba(59, 130, 246, 0.06);
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
    }
    .pull-indicator.pulling {
      transition: none;
    }
    .pull-indicator.refreshing {
      height: 48px;
    }
    .pull-indicator .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      margin-right: 8px;
    }
    .pull-indicator.refreshing .spinner {
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .pull-arrow {
      margin-right: 8px;
      transition: transform 0.2s;
      font-size: 16px;
    }
    .pull-arrow.ready {
      transform: rotate(180deg);
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 12px 0;
      scroll-behavior: smooth;
      overscroll-behavior-y: contain;
    }
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-track { background: transparent; }
    .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #475569;
      gap: 12px;
    }
    .empty-icon {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-icon svg { width: 28px; height: 28px; fill: #334155; }
    .empty-text { font-size: 15px; font-weight: 500; }
    .empty-hint { font-size: 13px; color: #334155; }

    .input-bar {
      display: flex;
      gap: 10px;
      padding: 8px 14px;
      background: rgba(10, 14, 26, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    input {
      flex: 1;
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 22px;
      color: #f1f5f9;
      font-size: 16px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    input::placeholder { color: #475569; }
    input:focus { border-color: rgba(59, 130, 246, 0.4); }
    button {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
      border: none;
      border-radius: 22px;
      padding: 0 20px;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
      white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    button:active { transform: scale(0.96); opacity: 0.9; }
    button:disabled { opacity: 0.4; }

    @media (min-width: 768px) {
      .input-bar {
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
        padding: 12px 20px;
      }
    }
  `;

  static properties = {
    messages: { type: Array },
    thinking: { type: Boolean },
    streaming: { type: Boolean },
    _pullState: { type: String, state: true },
    _pullHeight: { type: Number, state: true },
  };

  constructor() {
    super();
    this.messages = [];
    this.thinking = false;
    this.streaming = false;
    this._pullState = 'idle'; // idle | pulling | ready | refreshing
    this._pullHeight = 0;
    this._touchStartY = 0;
    this._pulling = false;
  }

  updated(changed) {
    if (changed.has('messages')) {
      this._scrollToBottom();
    }
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.messages');
    if (!el) return;

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

  _send(e) {
    e.preventDefault();
    const input = this.shadowRoot.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    hapticMedium();
    this.dispatchEvent(new CustomEvent('send-message', { detail: text }));
  }

  render() {
    const chatMessages = this.messages.filter(m => m.category === 'chat' || m.role === 'user');

    const pullClasses = ['pull-indicator'];
    if (this._pullState === 'pulling' || this._pullState === 'ready') pullClasses.push('pulling');
    if (this._pullState === 'refreshing') pullClasses.push('refreshing');

    const pullStyle = this._pullState === 'pulling' || this._pullState === 'ready'
      ? `height: ${this._pullHeight}px` : '';

    return html`
      <div class=${pullClasses.join(' ')} style=${pullStyle}>
        ${this._pullState === 'refreshing' ? html`
          <div class="spinner"></div>
          <span>Refreshing...</span>
        ` : html`
          <span class="pull-arrow ${this._pullState === 'ready' ? 'ready' : ''}">&#x2193;</span>
          <span>${this._pullState === 'ready' ? 'Release to refresh' : 'Pull to refresh'}</span>
        `}
      </div>
      <div class="messages">
        ${chatMessages.length === 0 ? html`
          <div class="empty">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </div>
            <div class="empty-text">No messages yet</div>
            <div class="empty-hint">Send a message to get started</div>
          </div>
        ` : ''}
        ${chatMessages.map(m => html`
          <message-item
            .role=${m.role}
            .text=${m.text}
            .timestamp=${m.timestamp}
            .category=${m.category}
            .streaming=${m.streaming || false}
          ></message-item>
        `)}
        ${this.thinking ? html`<stream-indicator mode="thinking"></stream-indicator>` : ''}
        ${this.streaming && !this.thinking ? html`<stream-indicator mode="streaming"></stream-indicator>` : ''}
      </div>
      <form class="input-bar" @submit=${this._send}>
        <input type="text" placeholder="Message OpenClaw..." autocomplete="off">
        <button type="submit">Send</button>
      </form>
    `;
  }
}

customElements.define('chat-view', ChatView);
