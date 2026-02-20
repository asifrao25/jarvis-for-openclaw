import { LitElement, html, css } from 'lit';
import { hapticLight } from '../services/haptics.js';

export class NavBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      justify-content: space-around;
      align-items: center;
      position: relative;
    }

    button {
      background: transparent;
      border: none;
      color: #555;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 20px;
      cursor: pointer;
      position: relative;
      transition: color 0.3s;
    }

    button.active {
      color: var(--c-primary);
    }

    .icon-box {
      width: 24px; height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    svg {
      width: 24px; height: 24px;
      fill: currentColor;
      filter: drop-shadow(0 0 0 transparent);
      transition: filter 0.3s;
    }
    
    button.active svg {
      filter: drop-shadow(0 0 5px var(--c-primary));
    }

    .label {
      font-family: var(--f-mono);
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .badge {
      position: absolute;
      top: -5px; right: -5px;
      background: var(--c-alert);
      color: #FFF;
      font-size: 9px;
      font-weight: bold;
      padding: 2px 4px;
      border-radius: 4px;
      box-shadow: 0 0 5px var(--c-alert);
    }

    /* Active Indicator Line */
    .indicator {
      position: absolute;
      top: 0;
      height: 2px;
      width: 40px;
      background: var(--c-primary);
      box-shadow: 0 0 8px var(--c-primary);
      transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }
  `;

  static properties = {
    active: { type: String },
    alertCount: { type: Number },
    reportCount: { type: Number },
  };

  _nav(view) {
    this.dispatchEvent(new CustomEvent('navigate', { detail: view, bubbles: true, composed: true }));
    hapticLight();
  }

  render() {
    return html`
      <button class=${this.active === 'chat' ? 'active' : ''} @click=${() => this._nav('chat')}>
        <div class="icon-box">
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
        <span class="label">Chat</span>
      </button>

      <button class=${this.active === 'alert' ? 'active' : ''} @click=${() => this._nav('alert')}>
        <div class="icon-box">
          <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          ${this.alertCount > 0 ? html`<span class="badge">${this.alertCount}</span>` : ''}
        </div>
        <span class="label">Alerts</span>
      </button>

      <button class=${this.active === 'report' ? 'active' : ''} @click=${() => this._nav('report')}>
        <div class="icon-box">
          <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          ${this.reportCount > 0 ? html`<span class="badge">${this.reportCount}</span>` : ''}
        </div>
        <span class="label">Reports</span>
      </button>
    `;
  }
}

customElements.define('nav-bar', NavBar);
