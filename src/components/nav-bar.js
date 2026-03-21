import { LitElement, html, css } from 'lit';
import { hapticLight, hapticMedium, hapticSuccess } from '../services/haptics.js';

export class NavBar extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 2px;
      height: 64px;
      background: #000;
      border-top: 1px solid rgba(0, 255, 255, 0.15);
      z-index: 1100;
      transition: transform 0.38s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, opacity;
      box-sizing: border-box;
      pointer-events: auto;
    }

    .nav-container {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: space-evenly;
      padding: 0 10px;
      box-sizing: border-box;
    }

    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: rgba(0, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      height: 100%;
      background: transparent;
      border: none;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    .nav-item:active {
      background: rgba(0, 255, 255, 0.1);
    }

    .nav-item.active {
      color: var(--c-primary);
      text-shadow: 0 0 10px var(--c-primary-dim);
    }

    .nav-item.active::after {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 2px;
      background: var(--c-primary);
      box-shadow: 0 0 10px var(--c-primary);
    }

    .nav-item svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
      pointer-events: none;
    }

    .nav-item .label {
      font-family: var(--f-mono);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      pointer-events: none;
    }

    .badge {
      position: absolute;
      top: 8px;
      right: calc(50% - 24px);
      background: var(--c-alert);
      color: white;
      font-size: 9px;
      font-weight: 900;
      min-width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      box-shadow: 0 0 8px var(--c-alert);
      font-family: var(--f-mono);
      border: 1px solid rgba(255,255,255,0.4);
      pointer-events: none;
    }

    .refresh-btn {
      width: 50px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c-primary);
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .refresh-btn:active {
      opacity: 1;
      background: rgba(0, 255, 255, 0.1);
    }

    .refresh-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .refresh-btn.spinning svg {
      animation: refresh-spin 0.8s linear infinite;
    }

    @keyframes refresh-spin {
      to { transform: rotate(360deg); }
    }

    @media (min-width: 1024px) {
      :host {
        height: 80px;
        bottom: 30px;
      }
      .nav-item {
        gap: 6px;
      }
      .nav-item svg {
        width: 26px;
        height: 26px;
      }
      .nav-item .label {
        font-size: 11px;
      }
      .badge {
        top: 12px;
        right: calc(50% - 30px);
      }
    }
  `;

  static properties = {
    active: { type: String },
    alertCount: { type: Number },
    reportCount: { type: Number },
    keyboardOpen: { type: Boolean, reflect: true, attribute: 'keyboard-open' },
    _refreshing: { type: Boolean, state: true },
    _refreshDone: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this._refreshing = false;
    this._refreshDone = false;
  }

  async _checkForUpdate() {
    if (this._refreshing) return;
    this._refreshing = true;
    this._refreshDone = false;
    hapticMedium();

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          let reloading = false;
          const onControllerChange = () => {
            if (reloading) return;
            reloading = true;
            window.location.reload();
          };
          navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true });
          await reg.update();
          await new Promise(resolve => setTimeout(resolve, 2000));
          if (!reloading) {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            window.location.reload();
          }
          return;
        }
      }
    } catch (e) {
      console.error('[Nav] Update check failed:', e);
    }

    window.location.reload();
  }

  _nav(view) {
    this.dispatchEvent(new CustomEvent('navigate', { detail: view, bubbles: true, composed: true }));
    hapticLight();
  }

  render() {
    return html`
      <div class="nav-container">
        <button class="refresh-btn ${this._refreshing ? 'spinning' : ''}" @click=${this._checkForUpdate} aria-label="Refresh">
          <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </button>

        <div class="nav-item ${this.active === 'chat' ? 'active' : ''}" @click=${() => this._nav('chat')}>
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span class="label">Chat</span>
        </div>

        <div class="nav-item ${this.active === 'alert' ? 'active' : ''}" @click=${() => this._nav('alert')}>
          <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          <span class="label">Alerts</span>
          ${this.alertCount > 0 ? html`<span class="badge">${this.alertCount}</span>` : ''}
        </div>

        <div class="nav-item ${this.active === 'report' ? 'active' : ''}" @click=${() => this._nav('report')}>
          <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          <span class="label">Reports</span>
          ${this.reportCount > 0 ? html`<span class="badge">${this.reportCount}</span>` : ''}
        </div>

        <div class="nav-item ${this.active === 'settings' ? 'active' : ''}" @click=${() => this._nav('settings')}>
          <svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.13,5.91,7.62,6.29L5.23,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.72,8.87 c-0.11,0.21-0.06,0.47,0.12,0.61l2.03,1.58C4.84,11.36,4.81,11.66,4.81,12c0,0.33,0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.5c-1.93,0-3.5-1.57-3.5-3.5 s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.93,15.5,12,15.5z"/></svg>
          <span class="label">Settings</span>
        </div>
      </div>
    `;
  }
}

customElements.define('nav-bar', NavBar);
