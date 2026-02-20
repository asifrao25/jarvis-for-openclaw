import { LitElement, html, css } from 'lit';
import { hapticLight, hapticMedium } from '../services/haptics.js';

export class NavBar extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      right: 6px;
      /* Aligned with the 56px flush input bar */
      bottom: 6px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host([ui-hidden]) {
      transform: translateY(100px);
      opacity: 0;
    }

    :host([keyboard-open]) {
      bottom: 6px;
    }

    .menu-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      opacity: 0;
      transform: translateY(20px) scale(0.9);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      margin-bottom: 12px;
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
      width: 44px; height: 44px;
      border-radius: 10px;
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
      width: 28px; height: 28px;
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
          <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        ` : html`
          <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
        `}
      </button>
    `;
  }
}

customElements.define('nav-bar', NavBar);
