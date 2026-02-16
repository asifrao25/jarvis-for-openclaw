import { LitElement, html, css } from 'lit';

export class MessageItem extends LitElement {
  static styles = css`
    :host { display: block; }

    .msg {
      padding: 12px 16px;
      margin: 4px 0;
      animation: fadeIn 0.2s ease;
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
    }
    .msg.assistant {
      margin: 6px 56px 6px 0;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 4px 18px 18px 18px;
      border: 1px solid rgba(255, 255, 255, 0.04);
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
    }
    .msg.user .time { color: rgba(255, 255, 255, 0.6); }

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
      .msg.user { margin-left: 120px; margin-right: 20px; }
      .msg.assistant { margin-right: 120px; }
      .text { font-size: 15px; }
    }
    @media (min-width: 1024px) {
      .msg.user { margin-left: 200px; margin-right: 24px; }
      .msg.assistant { margin-right: 200px; }
    }
  `;

  static properties = {
    role: { type: String },
    text: { type: String },
    timestamp: { type: Number },
    category: { type: String },
    streaming: { type: Boolean },
  };

  constructor() {
    super();
    this.role = 'assistant';
    this.text = '';
    this.timestamp = 0;
    this.category = 'chat';
    this.streaming = false;
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

    return html`
      <div class=${classes.join(' ')}>
        ${this.role === 'assistant' ? html`
          <div class="role">${this.category === 'alert' ? 'Alert' : this.category === 'report' ? 'Report' : 'OpenClaw'}</div>
        ` : ''}
        <div class="text">${this.text}</div>
        ${this.timestamp ? html`<div class="time">${this._formatTime(this.timestamp)}</div>` : ''}
      </div>
    `;
  }
}

customElements.define('message-item', MessageItem);
