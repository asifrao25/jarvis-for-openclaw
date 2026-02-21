import { LitElement, html, css } from 'lit';
import { hapticLight, hapticMedium } from '../services/haptics.js';

export class NavBar extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      right: 0;
      /* Force literal bottom flush */
      bottom: 0;
      width: 50px;
      /* Exactly 40px to match input area, solid black background to hit bottom edge */
      height: 40px;
      padding-bottom: 2px;
      background: #000;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
    }

    :host([ui-hidden]) {
      transform: translateY(100px);
      opacity: 0;
    }

    :host([keyboard-open]) {
      bottom: 0;
    }

    .menu-container {
      position: absolute;
      bottom: 52px; /* 40px bar + 12px margin */
      right: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      opacity: 0;
      transform: translateY(20px) scale(0.9);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      background: rgba(0, 15, 20, 0.98);
      border: 1px solid var(--c-primary);
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .menu-container.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .nav-item {
      width: 140px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.1);
      color: var(--c-primary);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-item:active {
      background: rgba(0, 255, 255, 0.2);
      transform: scale(0.96);
    }

    .nav-item svg {
      width: 18px; height: 18px;
      fill: currentColor;
    }

    .nav-item .label {
      font-family: var(--f-mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .fab-main {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(0, 30, 40, 0.9);
      border: 1px solid var(--c-primary);
      color: var(--c-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
      pointer-events: auto;
      transition: all 0.3s ease;
      position: relative;
      padding: 0;
      backdrop-filter: blur(10px);
    }

    .fab-main.open {
      background: var(--c-primary);
      color: #000;
    }

    .fab-main svg {
      width: 18px; height: 18px;
      fill: currentColor;
      transition: transform 0.3s ease;
    }

    .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--c-alert);
      color: white;
      font-size: 10px;
      font-weight: 900;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      box-shadow: 0 0 10px var(--c-alert);
      font-family: var(--f-mono);
      border: 1px solid rgba(255,255,255,0.4);
      z-index: 5;
    }

    .nav-item .badge {
      position: static;
      margin-left: auto;
    }
  `;

  static properties = {
    active: { type: String },
    alertCount: { type: Number },
    reportCount: { type: Number },
    open: { type: Boolean, state: true },
    uiHidden: { type: Boolean, reflect: true, attribute: 'ui-hidden' },
    keyboardOpen: { type: Boolean, reflect: true, attribute: 'keyboard-open' }
  };

  constructor() {
    super();
    this.open = false;
    this.uiHidden = false;
  }

  _toggle() {
    this.open = !this.open;
    hapticMedium();
  }

  _nav(view) {
    this.dispatchEvent(new CustomEvent('navigate', { detail: view, bubbles: true, composed: true }));
    this.open = false;
    hapticLight();
  }

  render() {
    const totalUnread = (this.alertCount || 0) + (this.reportCount || 0);

    return html`
      <div class="menu-container ${this.open ? 'open' : ''}">
        <div class="nav-item" @click=${() => this._nav('settings')}>
          <svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.13,5.91,7.62,6.29L5.23,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.72,8.87 c-0.11,0.21-0.06,0.47,0.12,0.61l2.03,1.58C4.84,11.36,4.81,11.66,4.81,12c0,0.33,0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.5c-1.93,0-3.5-1.57-3.5-3.5 s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.93,15.5,12,15.5z"/></svg>
          <span class="label">Settings</span>
        </div>

        <div class="nav-item" @click=${() => this._nav('report')}>
          <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          <span class="label">Reports</span>
          ${this.reportCount > 0 ? html`<span class="badge">${this.reportCount}</span>` : ''}
        </div>

        <div class="nav-item" @click=${() => this._nav('alert')}>
          <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          <span class="label">Alerts</span>
          ${this.alertCount > 0 ? html`<span class="badge">${this.alertCount}</span>` : ''}
        </div>

        ${this.active !== 'chat' ? html`
          <div class="nav-item" @click=${() => this._nav('chat')}>
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            <span class="label">Interface</span>
          </div>
        ` : ''}
      </div>

      <button class="fab-main ${this.open ? 'open' : ''}" @click=${this._toggle} aria-label="Toggle Menu">
        ${!this.open && totalUnread > 0 ? html`<span class="badge">${totalUnread}</span>` : ''}
        ${this.open ? html`
          <svg viewBox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
        ` : html`
          <svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>
        `}
      </button>
    `;
  }
}

customElements.define('nav-bar', NavBar);
