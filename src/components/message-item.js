import { LitElement, html, css } from 'lit';
import { hapticMedium } from '../services/haptics.js';

export class MessageItem extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      margin-bottom: 8px;
      font-family: var(--f-body);
      font-size: var(--chat-font-size, 14px);
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
      color: var(--chat-user-color, #E0F7FA);
      box-shadow: 0 0 10px rgba(0, 153, 255, 0.1);
    }

    .role-assistant {
      align-self: flex-start;
      background: rgba(0, 20, 30, 0.8);
      border: 1px solid var(--c-primary-dim);
      color: var(--chat-agent-color, var(--c-text));
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
      font-size: calc(var(--chat-font-size, 14px) * 0.75);
      color: #FFFFFF;
      margin-top: 6px;
      text-align: right;
      font-family: var(--f-mono);
      font-weight: 500;
      opacity: 0.5;
    }

    .action-menu {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: rgba(0, 20, 30, 0.95);
      border: 1px solid var(--c-primary);
      border-radius: 8px;
      padding: 4px;
      display: flex;
      gap: 8px;
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
    }

    .action-menu.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, -50%) scale(1);
    }

    .action-btn {
      background: transparent;
      border: none;
      color: var(--c-primary);
      font-family: var(--f-mono);
      font-size: 10px;
      padding: 8px 12px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 4px;
    }

    .action-btn:active {
      background: rgba(0, 255, 255, 0.1);
    }

    .action-btn.delete {
      color: var(--c-alert);
    }
  `;

  static properties = {
    msgId: { type: Number },
    role: { type: String },
    text: { type: String },
    timestamp: { type: Number },
    seen: { type: Boolean },
    _menuOpen: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.seen = true;
    this._menuOpen = false;
    this._observer = null;
    this._pressTimer = null;
  }

  _handleMessageClick(e) {
    // If it's a new/unread message, first tap marks it as seen
    if (this.role === 'assistant' && !this.seen) {
      this._markAsSeen();
      hapticLight();
      return;
    }

    // Otherwise, toggle the action menu
    this._menuOpen = !this._menuOpen;
    if (this._menuOpen) hapticMedium();
  }

  render() {
    const containerClasses = ['message-container', `role-${this.role}`];
    if (this.role === 'assistant' && !this.seen) {
      containerClasses.push('unread');
    }

    return html`
      <div class="${containerClasses.join(' ')}" 
           @click=${this._handleMessageClick}>
        <div class="text">${this.text}</div>
        <div class="meta">${new Date(this.timestamp).toLocaleTimeString()}</div>

        <div class="action-menu ${this._menuOpen ? 'visible' : ''}" @click=${(e) => e.stopPropagation()}>
          <button class="action-btn" @click=${this._copy}>Copy</button>
          <button class="action-btn delete" @click=${this._delete}>Delete</button>
          <button class="action-btn" @click=${() => this._menuOpen = false}>Close</button>
        </div>
      </div>
      ${this._menuOpen ? html`<div style="position:fixed; inset:0; z-index:90;" @click=${() => this._menuOpen = false}></div>` : ''}
    `;
  }
}

customElements.define('message-item', MessageItem);
