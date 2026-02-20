import { LitElement, html, css } from 'lit';
import { hapticMedium } from '../services/haptics.js';

export class MessageItem extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      margin-bottom: 8px;
      font-family: var(--f-body);
      font-size: 14px;
      line-height: 1.4;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .message-container {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 8px;
      position: relative;
      transition: all 0.5s ease;
    }
    
    .role-user {
      align-self: flex-end;
      background: rgba(0, 153, 255, 0.2);
      border: 1px solid rgba(0, 153, 255, 0.4);
      color: #E0F7FA;
      box-shadow: 0 0 10px rgba(0, 153, 255, 0.1);
    }

    .role-assistant {
      align-self: flex-start;
      background: rgba(0, 20, 30, 0.8);
      border: 1px solid var(--c-primary-dim);
      color: var(--c-text);
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.05);
    }
    
    .role-assistant::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
      background: var(--c-primary);
      box-shadow: 0 0 8px var(--c-primary);
    }

    /* Unread Highlight for Assistant Messages */
    .role-assistant.unread {
      border: 1px solid var(--c-primary);
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      animation: pulse-border 2s infinite;
    }

    @keyframes pulse-border {
      0% { border-color: var(--c-primary-dim); box-shadow: 0 0 10px rgba(0, 255, 255, 0.2); }
      50% { border-color: var(--c-primary); box-shadow: 0 0 25px rgba(0, 255, 255, 0.5); }
      100% { border-color: var(--c-primary-dim); box-shadow: 0 0 10px rgba(0, 255, 255, 0.2); }
    }

    .meta {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      text-align: right;
      font-family: var(--f-mono);
    }
  `;

  static properties = {
    msgId: { type: Number },
    role: { type: String },
    text: { type: String },
    timestamp: { type: Number },
    seen: { type: Boolean },
  };

  constructor() {
    super();
    this.seen = true;
    this._observer = null;
  }

  firstUpdated() {
    if (this.role === 'assistant' && !this.seen) {
      this._setupObserver();
    }
  }

  _setupObserver() {
    this._observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this._markAsSeen();
      }
    }, { threshold: 0.5 });
    this._observer.observe(this.shadowRoot.querySelector('.message-container'));
  }

  _markAsSeen() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    
    // Only trigger if still unseen
    if (!this.seen) {
      this.dispatchEvent(new CustomEvent('message-seen', {
        detail: { id: this.msgId, timestamp: this.timestamp },
        bubbles: true,
        composed: true
      }));
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  render() {
    const containerClasses = ['message-container', `role-${this.role}`];
    if (this.role === 'assistant' && !this.seen) {
      containerClasses.push('unread');
    }

    return html`
      <div class="${containerClasses.join(' ')}" @click=${this._markAsSeen}>
        <div class="text">${this.text}</div>
        <div class="meta">${new Date(this.timestamp).toLocaleTimeString()}</div>
      </div>
    `;
  }
}

customElements.define('message-item', MessageItem);
