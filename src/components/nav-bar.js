import { LitElement, html, css } from 'lit';
import { hapticLight } from '../services/haptics.js';

export class NavBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: rgba(10, 14, 26, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    nav {
      display: flex;
      height: 50px;
      max-width: 600px;
      margin: 0 auto;
    }
    button {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      background: none;
      border: none;
      color: #475569;
      font-size: 10px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      position: relative;
      padding: 6px 0;
      transition: color 0.2s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
    }
    button:active { transform: scale(0.95); }
    button.active { color: #3b82f6; }
    button svg { width: 24px; height: 24px; fill: currentColor; }
    .badge {
      position: absolute;
      top: 4px;
      right: calc(50% - 20px);
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      font-size: 10px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      line-height: 18px;
      border-radius: 9px;
      text-align: center;
      padding: 0 5px;
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
    }

    @media (min-width: 768px) {
      nav { height: 60px; }
      button { font-size: 11px; gap: 4px; }
      button svg { width: 26px; height: 26px; }
    }
  `;

  static properties = {
    active: { type: String },
    chatCount: { type: Number },
    alertCount: { type: Number },
    reportCount: { type: Number },
  };

  constructor() {
    super();
    this.active = 'chat';
    this.chatCount = 0;
    this.alertCount = 0;
    this.reportCount = 0;
  }

  _tap(tab) {
    hapticLight();
    this.dispatchEvent(new CustomEvent('navigate', { detail: tab }));
  }

  render() {
    return html`
      <nav>
        <button class=${this.active === 'chat' ? 'active' : ''} @click=${() => this._tap('chat')}>
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span>Chat</span>
          ${this.chatCount > 0 ? html`<span class="badge">${this.chatCount}</span>` : ''}
        </button>
        <button class=${this.active === 'alert' ? 'active' : ''} @click=${() => this._tap('alert')}>
          <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
          <span>Alerts</span>
          ${this.alertCount > 0 ? html`<span class="badge">${this.alertCount}</span>` : ''}
        </button>
        <button class=${this.active === 'report' ? 'active' : ''} @click=${() => this._tap('report')}>
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          <span>Reports</span>
          ${this.reportCount > 0 ? html`<span class="badge">${this.reportCount}</span>` : ''}
        </button>
      </nav>
    `;
  }
}

customElements.define('nav-bar', NavBar);
