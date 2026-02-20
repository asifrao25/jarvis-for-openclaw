import { LitElement, html, css } from 'lit';
import { hapticMedium } from '../services/haptics.js';

export class LoginScreen extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      padding: env(safe-area-inset-top, 20px) 20px env(safe-area-inset-bottom, 20px);
      position: relative;
      z-index: 1;
    }

    .card {
      width: 100%;
      max-width: 360px;
      text-align: center;
      background: rgba(8, 13, 20, 0.78);
      border: 1px solid rgba(0,255,238,.12);
      border-radius: 20px;
      padding: 44px 28px 38px;
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      box-shadow: 0 8px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(0,255,238,.08);
    }

    /* Logo mark */
    .logo-wrap {
      position: relative;
      width: 72px; height: 72px;
      margin: 0 auto 26px;
    }
    .logo-ring {
      position: absolute; inset: 0;
      animation: logoSpin 20s linear infinite;
      transform-origin: center;
    }
    .logo-core {
      position: absolute;
      inset: 20px;
      border-radius: 50%;
      background: #00ffee;
      box-shadow: 0 0 16px #00ffee, 0 0 32px rgba(0,255,238,.4);
      animation: corePulse 3s ease-in-out infinite;
    }
    @keyframes logoSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes corePulse {
      0%, 100% { box-shadow: 0 0 14px #00ffee, 0 0 28px rgba(0,255,238,.4); }
      50%       { box-shadow: 0 0 22px #00ffee, 0 0 48px rgba(0,255,238,.6); }
    }

    h1 {
      font-family: 'Orbitron', monospace;
      font-size: 20px;
      font-weight: 900;
      color: #d4eaf5;
      margin-bottom: 6px;
      letter-spacing: .3em;
      text-transform: uppercase;
      text-shadow: 0 0 20px rgba(0,255,238,.3);
    }
    .subtitle {
      font-family: 'JetBrains Mono', monospace;
      color: #4a6e82;
      font-size: 11px;
      letter-spacing: .10em;
      text-transform: uppercase;
      margin-bottom: 34px;
    }

    /* Input */
    .input-wrap {
      position: relative;
      margin-bottom: 12px;
    }
    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #4a6e82;
      pointer-events: none;
      font-size: 12px;
      line-height: 1;
    }
    input {
      width: 100%;
      padding: 13px 16px 13px 38px;
      background: #0d1520;
      border: 1px solid rgba(0,255,238,.12);
      border-radius: 12px;
      color: #d4eaf5;
      font-size: 16px;
      font-family: 'Syne', sans-serif;
      outline: none;
      caret-color: #00ffee;
      transition: border-color .2s, box-shadow .2s;
      -webkit-appearance: none;
    }
    input::placeholder {
      color: #2a3f50;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      letter-spacing: .04em;
    }
    input:focus {
      border-color: rgba(0,255,238,.30);
      box-shadow: 0 0 0 3px rgba(0,255,238,.05);
    }
    input:disabled { opacity: 0.5; }

    /* Connect button */
    button[type="submit"] {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #00ffee, #00c8b8);
      color: #030507;
      border: none;
      border-radius: 12px;
      font-family: 'Orbitron', monospace;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .15em;
      text-transform: uppercase;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      box-shadow: 0 4px 20px rgba(0,255,238,.25);
      transition: opacity .15s, transform .12s, box-shadow .15s;
    }
    button[type="submit"]:active {
      opacity: .9;
      transform: scale(.97);
      box-shadow: 0 2px 10px rgba(0,255,238,.2);
    }
    button[type="submit"]:disabled {
      opacity: 0.4;
      box-shadow: none;
    }

    .error {
      margin-top: 14px;
      padding: 11px 14px;
      background: rgba(255,77,109,.08);
      border: 1px solid rgba(255,77,109,.22);
      border-radius: 10px;
      color: #FECDD3;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      letter-spacing: .03em;
      text-align: left;
    }
  `;

  static properties = {
    error:   { type: String },
    loading: { type: Boolean },
  };

  constructor() {
    super();
    this.error = '';
    this.loading = false;
  }

  _submit(e) {
    e.preventDefault();
    const password = this.shadowRoot.querySelector('input').value;
    if (!password) return;
    this.loading = true;
    this.error = '';
    hapticMedium();
    this.dispatchEvent(new CustomEvent('login', { detail: { password } }));
  }

  setError(msg) {
    this.error = msg;
    this.loading = false;
  }

  render() {
    return html`
      <form class="card" @submit=${this._submit}>
        <div class="logo-wrap">
          <svg class="logo-ring" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="34" stroke="rgba(0,255,238,0.20)" stroke-width="1"/>
            <circle cx="36" cy="36" r="24" stroke="rgba(0,255,238,0.12)" stroke-width=".8" stroke-dasharray="3 3"/>
            <line x1="36" y1="1"  x2="36" y2="10" stroke="rgba(0,255,238,0.4)" stroke-width="1.2"/>
            <line x1="36" y1="62" x2="36" y2="71" stroke="rgba(0,255,238,0.4)" stroke-width="1.2"/>
            <line x1="1"  y1="36" x2="10" y2="36" stroke="rgba(0,255,238,0.4)" stroke-width="1.2"/>
            <line x1="62" y1="36" x2="71" y2="36" stroke="rgba(0,255,238,0.4)" stroke-width="1.2"/>
          </svg>
          <div class="logo-core"></div>
        </div>
        <h1>Jarvis</h1>
        <p class="subtitle">// connect to gateway</p>
        <div class="input-wrap">
          <span class="input-icon">◈</span>
          <input
            type="password"
            placeholder="access key"
            autocomplete="current-password"
            ?disabled=${this.loading}>
        </div>
        <button type="submit" ?disabled=${this.loading}>
          ${this.loading ? 'Connecting…' : 'Connect'}
        </button>
        ${this.error ? html`<div class="error">⚠ ${this.error}</div>` : ''}
      </form>
    `;
  }
}

customElements.define('login-screen', LoginScreen);
