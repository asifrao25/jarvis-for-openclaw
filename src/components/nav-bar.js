import { LitElement, html, css } from 'lit';
import { hapticLight } from '../services/haptics.js';

export class NavBar extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      pointer-events: none;
      background: rgba(8, 12, 22, 0.95);
      padding-bottom: env(safe-area-inset-bottom, 0);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    nav {
      display: flex;
      width: 100%;
      padding: 0 8px;
      background: transparent;
      pointer-events: auto;
      position: relative;
    }
    nav::before {
      content: '';
      position: absolute;
      top: 0;
      left: 10%;
      right: 10%;
      height: 1px;
      background: linear-gradient(90deg,
        transparent,
        rgba(56, 189, 248, 0.2) 30%,
        rgba(129, 140, 248, 0.25) 70%,
        transparent);
    }
    button {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      background: transparent;
      border: none;
      color: #3D4E63;
      font-size: 10px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      position: relative;
      padding: 10px 8px;
      border-radius: 14px;
      margin: 6px 2px;
      transition: color 0.2s ease;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      letter-spacing: 0.2px;
      min-height: 52px;
    }
    button:active { transform: scale(0.9); }

    button.active[data-tab="chat"] { color: #38BDF8; }
    button.active[data-tab="chat"] svg { filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.6)); }

    button.active[data-tab="alert"] { color: #FB7185; }
    button.active[data-tab="alert"] svg { filter: drop-shadow(0 0 5px rgba(251, 113, 133, 0.6)); }

    button.active[data-tab="report"] { color: #34D399; }
    button.active[data-tab="report"] svg { filter: drop-shadow(0 0 5px rgba(52, 211, 153, 0.6)); }

    button.active::after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 18px;
      height: 3px;
      border-radius: 2px;
    }
    button.active[data-tab="chat"]::after { background: #38BDF8; }
    button.active[data-tab="alert"]::after { background: #FB7185; }
    button.active[data-tab="report"]::after { background: #34D399; }

    button svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }
    button .label { font-size: 10px; line-height: 1; }

    .badge {
      position: absolute;
      top: 7px;
      right: calc(50% - 20px);
      min-width: 16px;
      height: 16px;
      line-height: 16px;
      border-radius: 8px;
      background: #EF4444;
      color: white;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      padding: 0 4px;
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5);
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
        <button
          class=${this.active === 'chat' ? 'active' : ''}
          data-tab="chat"
          @click=${() => this._tap('chat')}>
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span class="label">Chat</span>
          ${this.chatCount > 0 ? html`<span class="badge">${this.chatCount}</span>` : ''}
        </button>
        <button
          class=${this.active === 'alert' ? 'active' : ''}
          data-tab="alert"
          @click=${() => this._tap('alert')}>
          <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
          <span class="label">Alerts</span>
          ${this.alertCount > 0 ? html`<span class="badge">${this.alertCount}</span>` : ''}
        </button>
        <button
          class=${this.active === 'report' ? 'active' : ''}
          data-tab="report"
          @click=${() => this._tap('report')}>
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          <span class="label">Reports</span>
          ${this.reportCount > 0 ? html`<span class="badge">${this.reportCount}</span>` : ''}
        </button>
      </nav>
    `;
  }
}

customElements.define('nav-bar', NavBar);
