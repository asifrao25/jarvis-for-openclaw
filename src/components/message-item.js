import { LitElement, html, css } from 'lit';
import { hapticLight } from '../services/haptics.js';

export class MessageItem extends LitElement {
  static styles = css`
    :host { display: block; overflow: hidden; }

    .swipe-container {
      position: relative;
    }
    .delete-bg {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ef4444;
      color: white;
      font-size: 13px;
      font-weight: 600;
      border-radius: 12px;
    }
    .delete-bg svg {
      width: 22px;
      height: 22px;
      fill: white;
    }

    .msg {
      padding: 12px 16px;
      margin: 4px 0;
      animation: fadeIn 0.2s ease;
      position: relative;
      transition: transform 0.2s ease;
      background: #0a0e1a;
    }
    .msg.swiping {
      transition: none;
    }
    .msg.removing {
      transition: transform 0.3s ease, opacity 0.3s ease;
      transform: translateX(-100%) !important;
      opacity: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .msg.user {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      margin: 6px 16px 6px 56px;
      border-radius: 18px 18px 4px 18px;
      color: white;
      width: fit-content;
      max-width: calc(100% - 72px);
    }
    .swipe-container.user-msg {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .msg.assistant {
      margin: 6px auto 6px 0;
      margin-right: 56px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 4px 18px 18px 18px;
      border: 1px solid rgba(255, 255, 255, 0.04);
      width: fit-content;
      max-width: calc(100% - 72px);
    }
    .msg.alert {
      border-left: 3px solid #ef4444;
      background: rgba(239, 68, 68, 0.06);
      border-radius: 0 12px 12px 0;
      margin: 6px 16px 6px 0;
    }
    .msg.report {
      border-left: 3px solid #3b82f6;
      background: rgba(59, 130, 246, 0.06);
      border-radius: 0 12px 12px 0;
      margin: 6px 16px 6px 0;
    }

    .role {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .msg.alert .role { color: #ef4444; }
    .msg.report .role { color: #3b82f6; }

    .text {
      font-size: 15px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .time {
      font-size: 11px;
      color: #475569;
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .msg.user .time { color: rgba(255, 255, 255, 0.6); justify-content: flex-end; }

    .ticks {
      display: inline-flex;
      align-items: center;
      font-size: 14px;
      line-height: 1;
    }
    .ticks.sending { opacity: 0.5; }
    .ticks.received { color: #ef4444; opacity: 1; }
    .ticks.failed { color: #ef4444; opacity: 1; }
    .ticks svg { width: 16px; height: 12px; }
    .ticks.received svg { fill: #ef4444; }
    .ticks.sending svg { fill: rgba(255, 255, 255, 0.6); }
    .ticks.failed svg { fill: #ef4444; }

    .streaming .text {
      opacity: 0.85;
    }
    .streaming .text::after {
      content: '|';
      animation: blink 1s step-end infinite;
      color: #3b82f6;
      font-weight: 300;
    }
    @keyframes blink {
      50% { opacity: 0; }
    }

    @media (min-width: 768px) {
      .msg { padding: 14px 20px; }
      .msg.user { margin-left: 120px; max-width: calc(100% - 140px); }
      .msg.assistant { margin-right: 120px; max-width: calc(100% - 140px); }
      .text { font-size: 15px; }
    }
    @media (min-width: 1024px) {
      .msg.user { margin-left: 200px; max-width: calc(100% - 224px); }
      .msg.assistant { margin-right: 200px; max-width: calc(100% - 224px); }
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

      // Determine direction on first significant move
      if (this._isHorizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        this._isHorizontal = Math.abs(dx) > Math.abs(dy);
      }

      if (!this._isHorizontal) return;

      // Only allow left swipe (negative dx)
      if (dx < 0) {
        this._swiping = true;
        this._swipeX = Math.max(dx, -100);
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      if (!this._swiping) return;
      if (this._swipeX < -60) {
        // Delete threshold reached
        hapticLight();
        this._removing = true;
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('delete-message', {
            detail: { id: this.msgId, timestamp: this.timestamp },
            bubbles: true, composed: true,
          }));
        }, 300);
      }
      this._swipeX = 0;
      this._swiping = false;
      this._isHorizontal = null;
    }, { passive: true });
  }

  _renderTicks() {
    // Clock icon for sending
    if (this.status === 'sending') {
      return html`<span class="ticks sending">
        <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
      </span>`;
    }
    // Double check for received (gateway acknowledged)
    if (this.status === 'received') {
      return html`<span class="ticks received">
        <svg viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>
      </span>`;
    }
    // X for failed
    if (this.status === 'failed') {
      return html`<span class="ticks failed">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
      </span>`;
    }
    return '';
  }

  _formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  render() {
    const classes = ['msg', this.role];
    if (this.category === 'alert') classes.push('alert');
    if (this.category === 'report') classes.push('report');
    if (this.streaming) classes.push('streaming');
    if (this._swiping) classes.push('swiping');
    if (this._removing) classes.push('removing');

    const swipeStyle = this._swipeX < 0 ? `transform: translateX(${this._swipeX}px)` : '';

    const containerClasses = this.role === 'user' ? 'swipe-container user-msg' : 'swipe-container';

    return html`
      <div class=${containerClasses}>
        ${this._swipeX < -10 ? html`
          <div class="delete-bg">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </div>
        ` : ''}
        <div class=${classes.join(' ')} style=${swipeStyle}>
          ${this.role === 'assistant' ? html`
            <div class="role">${this.category === 'alert' ? 'Alert' : this.category === 'report' ? 'Report' : 'Jarvis'}</div>
          ` : ''}
          <div class="text">${this.text}</div>
          ${this.timestamp ? html`<div class="time">
            <span>${this._formatTime(this.timestamp)}</span>
            ${this.role === 'user' && this.status ? this._renderTicks() : ''}
          </div>` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('message-item', MessageItem);
