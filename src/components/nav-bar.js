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
      background: rgba(6, 10, 18, 0.97);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host([scroll-hidden]) {
      transform: translateY(100%);
    }
    :host([keyboard-open]) {
      display: none;
    }

    nav {
      display: flex;
      width: 100%;
      padding: 10px 0 8px;
      justify-content: space-around;
      align-items: center;
      background: transparent;
      pointer-events: auto;
      position: relative;
    }
    nav::before {
      content: '';
      position: absolute;
      top: 0;
      left: 8%;
      right: 8%;
      height: 1px;
      background: linear-gradient(90deg,
        transparent,
        rgba(56, 189, 248, 0.25) 30%,
        rgba(129, 140, 248, 0.3) 70%,
        transparent);
    }

    button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 7px;
      background: transparent;
      border: none;
      color: #3D4E63;
      font-size: 10px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      transition: color 0.2s ease;
    }
    button:active .btn-circle { transform: scale(0.88); }

    /* ── Circle container ── */
    .btn-circle {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: rgba(255, 255, 255, 0.03);
      border: 1.5px solid rgba(255, 255, 255, 0.09);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: visible;
    }

    /* inner shine arc */
    .btn-circle::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 20%;
      right: 20%;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      pointer-events: none;
    }

    /* ── Active: Chat (sky-blue) ── */
    button.active { color: #38BDF8; }

    button.active[data-tab="chat"] .btn-circle {
      background: radial-gradient(circle at 40% 35%,
        rgba(56, 189, 248, 0.22) 0%,
        rgba(56, 189, 248, 0.06) 65%,
        transparent 100%);
      border-color: rgba(56, 189, 248, 0.55);
      box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.15),
        0 0 18px rgba(56, 189, 248, 0.3),
        inset 0 1px 0 rgba(56, 189, 248, 0.25);
    }
    button.active[data-tab="chat"] svg {
      filter: drop-shadow(0 0 7px rgba(56, 189, 248, 0.9));
    }

    /* ── Active: Alert (rose) ── */
    button.active[data-tab="alert"] { color: #FB7185; }
    button.active[data-tab="alert"] .btn-circle {
      background: radial-gradient(circle at 40% 35%,
        rgba(251, 113, 133, 0.22) 0%,
        rgba(251, 113, 133, 0.06) 65%,
        transparent 100%);
      border-color: rgba(251, 113, 133, 0.55);
      box-shadow:
        0 0 0 1px rgba(251, 113, 133, 0.15),
        0 0 18px rgba(251, 113, 133, 0.3),
        inset 0 1px 0 rgba(251, 113, 133, 0.25);
    }
    button.active[data-tab="alert"] svg {
      filter: drop-shadow(0 0 7px rgba(251, 113, 133, 0.9));
    }

    /* ── Active: Report (emerald) ── */
    button.active[data-tab="report"] { color: #34D399; }
    button.active[data-tab="report"] .btn-circle {
      background: radial-gradient(circle at 40% 35%,
        rgba(52, 211, 153, 0.22) 0%,
        rgba(52, 211, 153, 0.06) 65%,
        transparent 100%);
      border-color: rgba(52, 211, 153, 0.55);
      box-shadow:
        0 0 0 1px rgba(52, 211, 153, 0.15),
        0 0 18px rgba(52, 211, 153, 0.3),
        inset 0 1px 0 rgba(52, 211, 153, 0.25);
    }
    button.active[data-tab="report"] svg {
      filter: drop-shadow(0 0 7px rgba(52, 211, 153, 0.9));
    }

    button svg {
      width: 30px;
      height: 30px;
      fill: currentColor;
    }

    .label {
      font-size: 9px;
      line-height: 1;
      letter-spacing: 0.8px;
    }

    /* Badge sits at top-right of circle */
    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      line-height: 18px;
      border-radius: 9px;
      background: #EF4444;
      color: white;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      padding: 0 5px;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.6);
      border: 1.5px solid rgba(6, 10, 18, 0.9);
    }
  `;

  static properties = {
    active: { type: String },
    chatCount: { type: Number },
    alertCount: { type: Number },
    reportCount: { type: Number },
    scrollHidden: { type: Boolean, reflect: true, attribute: 'scroll-hidden' },
  };

  constructor() {
    super();
    this.active = 'chat';
    this.chatCount = 0;
    this.alertCount = 0;
    this.reportCount = 0;
    this.scrollHidden = false;
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
          <div class="btn-circle">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            ${this.chatCount > 0 ? html`<span class="badge">${this.chatCount}</span>` : ''}
          </div>
          <span class="label">Chat</span>
        </button>

        <button
          class=${this.active === 'alert' ? 'active' : ''}
          data-tab="alert"
          @click=${() => this._tap('alert')}>
          <div class="btn-circle">
            <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            ${this.alertCount > 0 ? html`<span class="badge">${this.alertCount}</span>` : ''}
          </div>
          <span class="label">Alerts</span>
        </button>

        <button
          class=${this.active === 'report' ? 'active' : ''}
          data-tab="report"
          @click=${() => this._tap('report')}>
          <div class="btn-circle">
            <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            ${this.reportCount > 0 ? html`<span class="badge">${this.reportCount}</span>` : ''}
          </div>
          <span class="label">Reports</span>
        </button>
      </nav>
    `;
  }
}

customElements.define('nav-bar', NavBar);
