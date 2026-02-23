import { LitElement, html, css } from 'lit';
import { hapticMedium } from '../services/haptics.js';

export class MessageItem extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      margin-bottom: 24px;
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
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .text {
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
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
      background: rgba(0, 20, 30, 0.95);
      border: 1px solid var(--c-primary);
      color: var(--chat-agent-color, var(--c-text));
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.1);
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
      background: rgba(0, 20, 30, 0.98);
      border: 1px solid var(--c-primary);
      border-radius: 8px;
      padding: 4px 8px;
      display: flex;
      gap: 4px;
      z-index: 120;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(15px);
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
      white-space: nowrap;
      width: max-content;
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
      font-size: 11px;
      padding: 10px 14px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .action-btn:active {
      background: rgba(0, 255, 255, 0.1);
    }

    .action-btn.delete {
      color: var(--c-alert);
    }

    .copy-toast {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translate(-50%, 0);
      background: var(--c-primary);
      color: #fff;
      font-family: var(--f-mono);
      font-size: 12px;
      font-weight: 900;
      padding: 6px 16px;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
      z-index: 200;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
      letter-spacing: 1px;
    }

    .copy-toast.visible {
      opacity: 1;
      transform: translate(-50%, -45px);
    }

    .copy-toast.delete {
      background: var(--c-alert);
      color: #fff;
      box-shadow: 0 0 20px rgba(255, 51, 51, 0.4);
    }
  `;

  static properties = {
    msgId: { type: Number },
    role: { type: String },
    text: { type: String },
    timestamp: { type: Number },
    seen: { type: Boolean },
    _menuOpen: { type: Boolean, state: true },
    _showCopied: { type: Boolean, state: true },
    _toastText: { type: String, state: true },
    _isDeleteToast: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.seen = true;
    this._menuOpen = false;
    this._showCopied = false;
    this._toastText = 'COPIED';
    this._isDeleteToast = false;
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
        // Automatically mark as seen when scrolled into view
        setTimeout(() => this._markAsSeen(), 500);
      }
    }, { threshold: 0.5 });
    this._observer.observe(this.shadowRoot.querySelector('.message-container'));
  }

  _handleMessageClick(e) {
    if (this.role === 'assistant' && !this.seen) {
      this._markAsSeen();
      hapticMedium();
      return;
    }

    this._menuOpen = !this._menuOpen;
    if (this._menuOpen) hapticMedium();
  }

  async _copy() {
    try {
      await navigator.clipboard.writeText(this.text);
      this._toastText = 'COPIED';
      this._isDeleteToast = false;
      this._showCopied = true;
      this.requestUpdate();
      
      const { hapticSuccess } = await import('../services/haptics.js');
      hapticSuccess();
      
      // Delay closing the menu so the toast is visible above it for a moment
      setTimeout(() => {
        this._showCopied = false;
        this._menuOpen = false;
      }, 1200);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  _delete() {
    this._toastText = 'DELETED';
    this._isDeleteToast = true;
    this._showCopied = true;
    hapticMedium();

    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('delete-message', {
        detail: { id: this.msgId, timestamp: this.timestamp },
        bubbles: true,
        composed: true
      }));
      this._showCopied = false;
      this._menuOpen = false;
    }, 800);
  }

  _markAsSeen() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    
    if (!this.seen) {
      this.seen = true;
      this.dispatchEvent(new CustomEvent('message-seen', {
        detail: { id: this.msgId, timestamp: this.timestamp },
        bubbles: true,
        composed: true
      }));
      this.requestUpdate();
    }
  }

  render() {
    const containerClasses = ['message-container', `role-${this.role}`];
    if (this.role === 'assistant' && !this.seen) {
      containerClasses.push('unread');
    }

    return html`
      <div class="${containerClasses.join(' ')}" @click=${this._handleMessageClick}>
        <div class="copy-toast ${this._showCopied ? 'visible' : ''} ${this._isDeleteToast ? 'delete' : ''}">
          ${this._toastText}
        </div>
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
