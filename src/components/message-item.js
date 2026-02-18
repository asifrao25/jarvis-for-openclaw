import { LitElement, html, css } from 'lit';
import { hapticLight } from '../services/haptics.js';

export class MessageItem extends LitElement {
  static styles = css`
    :host { display: block; overflow: hidden; }

    /* Swipe-to-delete */
    .swipe-container { position: relative; }
    .swipe-container.user-msg {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .delete-bg {
      position: absolute;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.18);
      border: 1px solid rgba(239, 68, 68, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .delete-bg svg {
      width: 18px;
      height: 18px;
      fill: #FB7185;
    }

    /* Base message */
    .msg {
      padding: 11px 15px;
      margin: 3px 0;
      animation: msgIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      width: fit-content;
      max-width: calc(100% - 68px);
    }
    .msg.swiping { transition: none; }
    .msg.removing {
      transition: transform 0.28s ease, opacity 0.28s ease;
      transform: translateX(-100%) !important;
      opacity: 0;
    }

    @keyframes msgIn {
      from { opacity: 0; transform: translateY(6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* User bubble — gradient right-aligned */
    .msg.user {
      background: linear-gradient(135deg, #1E40AF 0%, #3B5BDB 45%, #6D28D9 100%);
      box-shadow: 0 4px 16px rgba(59, 91, 219, 0.35), 0 2px 4px rgba(0,0,0,0.3);
      margin-left: auto;
      margin-right: 14px;
      border-radius: 20px 20px 5px 20px;
      color: #F0F9FF;
    }

    /* Assistant bubble — dark glass left-aligned */
    .msg.assistant {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      margin-left: 14px;
      margin-right: auto;
      border-radius: 5px 20px 20px 20px;
      color: #CBD5E1;
      box-shadow: 0 2px 12px rgba(0,0,0,0.35);
    }

    /* Alert and report overrides (shown in chat if they appear) */
    .msg.alert {
      border-left: 3px solid rgba(251, 113, 133, 0.7);
      background: rgba(239, 68, 68, 0.07);
      border-top: 1px solid rgba(251, 113, 133, 0.15);
      border-right: 1px solid rgba(251, 113, 133, 0.08);
      border-bottom: 1px solid rgba(251, 113, 133, 0.08);
      border-radius: 0 16px 16px 0;
      margin-left: 14px;
      color: #FCA5A5;
    }
    .msg.report {
      border-left: 3px solid rgba(52, 211, 153, 0.7);
      background: rgba(52, 211, 153, 0.07);
      border-top: 1px solid rgba(52, 211, 153, 0.15);
      border-right: 1px solid rgba(52, 211, 153, 0.08);
      border-bottom: 1px solid rgba(52, 211, 153, 0.08);
      border-radius: 0 16px 16px 0;
      margin-left: 14px;
      color: #6EE7B7;
    }

    .text {
      font-size: 15px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg.user .text { color: #EFF6FF; }

    .meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 5px;
      justify-content: flex-end;
    }
    .msg.assistant .meta, .msg.alert .meta, .msg.report .meta {
      justify-content: flex-start;
    }
    .time {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.35);
      font-variant-numeric: tabular-nums;
    }
    .msg.assistant .time, .msg.alert .time, .msg.report .time {
      color: #475569;
    }

    /* Delivery ticks */
    .ticks {
      display: inline-flex;
      align-items: center;
      line-height: 1;
    }
    .ticks svg { width: 14px; height: 10px; }
    .ticks.sending svg { fill: rgba(255,255,255,0.35); }
    .ticks.received svg { fill: #60A5FA; }
    .ticks.failed svg { fill: #FB7185; }

    /* Streaming cursor */
    .msg.streaming .text::after {
      content: '';
      display: inline-block;
      width: 2px;
      height: 14px;
      background: #38BDF8;
      margin-left: 2px;
      vertical-align: text-bottom;
      border-radius: 1px;
      animation: cursor-blink 1s step-end infinite;
    }
    @keyframes cursor-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    @media (min-width: 768px) {
      .msg { max-width: calc(100% - 140px); }
    }
    @media (min-width: 1024px) {
      .msg { max-width: calc(100% - 240px); }
    }
  `;

  static properties = {
    role: { type: String },
    text: { type: String },
    timestamp: { type: Number },
    category: { type: String },
    streaming: { type: Boolean },
    msgId: { type: Number },
    status: { type: String },
    _swipeX: { type: Number, state: true },
    _swiping: { type: Boolean, state: true },
    _removing: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.role = 'assistant';
    this.text = '';
    this.timestamp = 0;
    this.category = 'chat';
    this.streaming = false;
    this.msgId = null;
    this.status = null;
    this._swipeX = 0;
    this._swiping = false;
    this._removing = false;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._isHorizontal = null;
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.msg');
    if (!el) return;

    el.addEventListener('touchstart', (e) => {
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
      this._isHorizontal = null;
      this._swiping = false;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - this._touchStartX;
      const dy = e.touches[0].clientY - this._touchStartY;

      if (this._isHorizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        this._isHorizontal = Math.abs(dx) > Math.abs(dy);
      }

      if (!this._isHorizontal) return;

      if (dx < 0) {
        this._swiping = true;
        this._swipeX = Math.max(dx, -100);
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      if (!this._swiping) return;
      if (this._swipeX < -60) {
        hapticLight();
        this._removing = true;
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('delete-message', {
            detail: { id: this.msgId, timestamp: this.timestamp },
            bubbles: true, composed: true,
          }));
        }, 280);
      }
      this._swipeX = 0;
      this._swiping = false;
      this._isHorizontal = null;
    }, { passive: true });
  }

  _renderTicks() {
    if (this.status === 'sending') {
      return html`<span class="ticks sending">
        <svg viewBox="0 0 24 24">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
      </span>`;
    }
    if (this.status === 'received') {
      return html`<span class="ticks received">
        <svg viewBox="0 0 24 24">
          <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
        </svg>
      </span>`;
    }
    if (this.status === 'failed') {
      return html`<span class="ticks failed">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
        </svg>
      </span>`;
    }
    return '';
  }

  _formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  render() {
    const classes = ['msg', this.role];
    if (this.category === 'alert') classes.push('alert');
    if (this.category === 'report') classes.push('report');
    if (this.streaming) classes.push('streaming');
    if (this._swiping) classes.push('swiping');
    if (this._removing) classes.push('removing');

    const swipeStyle = this._swipeX < 0 ? `transform: translateX(${this._swipeX}px)` : '';
    const containerClass = this.role === 'user' ? 'swipe-container user-msg' : 'swipe-container';

    return html`
      <div class=${containerClass}>
        ${this._swipeX < -10 ? html`
          <div class="delete-bg">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </div>
        ` : ''}
        <div class=${classes.join(' ')} style=${swipeStyle}>
          <div class="text">${this.text}</div>
          ${this.timestamp ? html`
            <div class="meta">
              <span class="time">${this._formatTime(this.timestamp)}</span>
              ${this.role === 'user' && this.status ? this._renderTicks() : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('message-item', MessageItem);
