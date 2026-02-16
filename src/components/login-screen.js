import { LitElement, html, css } from 'lit';
import { hapticMedium } from '../services/haptics.js';

export class LoginScreen extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      background: linear-gradient(145deg, #0a0e1a 0%, #0d1525 50%, #111b30 100%);
    }
    .card {
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 24px;
      padding: 40px 32px;
      width: 100%;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .logo {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
      font-weight: 700;
      color: white;
      letter-spacing: -1px;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 6px;
      letter-spacing: -0.3px;
    }
    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 28px;
      line-height: 1.4;
    }
    input {
      width: 100%;
      padding: 14px 18px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      color: #f1f5f9;
      font-size: 16px;
      font-family: inherit;
      outline: none;
      margin-bottom: 16px;
      transition: border-color 0.2s, background 0.2s;
    }
    input::placeholder { color: #475569; }
    input:focus {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(255, 255, 255, 0.07);
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    button:active { transform: scale(0.98); opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: default; transform: none; }
    .error {
      color: #ef4444;
      font-size: 13px;
      margin-top: 14px;
      padding: 10px 14px;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(239, 68, 68, 0.15);
    }
  `;

  static properties = {
    error: { type: String },
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
        <div class="logo">OC</div>
        <h1>OpenClaw</h1>
        <p class="subtitle">Sign in to your gateway</p>
        <input type="password" placeholder="Gateway password" autocomplete="current-password" ?disabled=${this.loading}>
        <button type="submit" ?disabled=${this.loading}>
          ${this.loading ? 'Connecting...' : 'Sign In'}
        </button>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      </form>
    `;
  }
}

customElements.define('login-screen', LoginScreen);
