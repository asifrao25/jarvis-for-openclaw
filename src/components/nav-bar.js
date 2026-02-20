import { LitElement, html, css } from 'lit';
import { hapticLight } from '../services/haptics.js';

export class NavBar extends LitElement {
  static styles = css`
    :host {
      flex-shrink: 0;
      pointer-events: none;
      background: rgba(3,5,7,.97);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-top: 1px solid rgba(0,255,238,.10);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      max-height: 200px;
      overflow: hidden;
      transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 100;
    }
    :host([scroll-hidden]) { max-height: 0; }
    :host([keyboard-open]) { display: none; }

    nav {
      display: flex;
      width: 100%;
      padding: 0 8px;
      justify-content: space-around;
      align-items: center;
      pointer-events: auto;
    }

    button {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 9px 0 7px;
      background: transparent;
      border: none;
      color: #3f6070;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      position: relative;
      transition: color .2s;
    }
    button.active { color: #00ffee; }

    /* Active top indicator */
    button.active::before {
      content: '';
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 28px; height: 2px;
      background: #00ffee;
      border-radius: 0 0 2px 2px;
      box-shadow: 0 0 8px #00ffee;
    }

    .btn-icon {
      width: 26px; height: 26px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background .2s, transform .15s;
    }
    button.active .btn-icon { background: rgba(0,255,238,.10); }
    button:active .btn-icon { transform: scale(.86); }

    button svg {
      width: 18px; height: 18px;
      fill: currentColor;
    }

    .label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      letter-spacing: .10em;
      text-transform: uppercase;
      line-height: 1;
    }

    .badge {
      position: absolute;
      top: -4px; right: -4px;
      min-width: 16px; height: 16px;
      line-height: 16px;
      border-radius: 8px;
      background: #FF4D6D;
      box-shadow: 0 0 8px rgba(255,77,109,.5);
      color: white;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      padding: 0 4px;
    }
  `;

  static properties = {
    active:       { type: String },
    chatCount:    { type: Number },
    alertCount:   { type: Number },
    reportCount:  { type: Number },
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
        <button class=${this.active === 'chat' ? 'active' : ''} @click=${() => this._tap('chat')}>
          <div class="btn-icon">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            ${this.chatCount > 0 ? html`<span class="badge">${this.chatCount}</span>` : ''}
          </div>
          <span class="label">Chat</span>
        </button>

        <button class=${this.active === 'alert' ? 'active' : ''} @click=${() => this._tap('alert')}>
          <div class="btn-icon">
            <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            ${this.alertCount > 0 ? html`<span class="badge">${this.alertCount}</span>` : ''}
          </div>
          <span class="label">Alerts</span>
        </button>

        <button class=${this.active === 'report' ? 'active' : ''} @click=${() => this._tap('report')}>
          <div class="btn-icon">
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
