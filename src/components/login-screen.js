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
      position: relative;
      overflow: hidden;
      background: #060A12;
      padding: env(safe-area-inset-top, 0) 0 env(safe-area-inset-bottom, 0);
    }

    /* Ambient background blobs */
    .bg-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      will-change: transform;
    }
    .bg-blob-1 {
      width: 280px;
      height: 280px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%);
      top: 10%;
      left: -10%;
      animation: float1 8s ease-in-out infinite;
    }
    .bg-blob-2 {
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(129, 140, 248, 0.1) 0%, transparent 70%);
      bottom: 15%;
      right: -15%;
      animation: float2 10s ease-in-out infinite;
    }
    .bg-blob-3 {
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%);
      top: 55%;
      left: 20%;
      animation: float3 7s ease-in-out infinite;
    }
    @keyframes float1 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(20px, -25px); }
    }
    @keyframes float2 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-18px, 22px); }
    }
    @keyframes float3 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(14px, -16px); }
    }

    /* Grid pattern overlay */
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
      pointer-events: none;
    }

    .card {
      position: relative;
      z-index: 1;
      background: rgba(12, 18, 32, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 28px;
      padding: 44px 32px 40px;
      width: calc(100% - 40px);
      max-width: 380px;
      text-align: center;
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      box-shadow:
        0 0 0 1px rgba(56, 189, 248, 0.06),
        0 24px 60px rgba(0,0,0,0.5),
        0 0 80px rgba(56, 189, 248, 0.04);
    }

    /* Logo mark */
    .logo-wrap {
      margin: 0 auto 28px;
      position: relative;
      width: 80px;
      height: 80px;
    }
    .logo-ring {
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 1px solid rgba(56, 189, 248, 0.25);
      animation: ring-rotate 6s linear infinite;
    }
    .logo-ring::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38BDF8;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.8);
    }
    @keyframes ring-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #1D4ED8 0%, #38BDF8 50%, #818CF8 100%);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 800;
      color: white;
      letter-spacing: -1px;
      box-shadow:
        0 0 30px rgba(56, 189, 248, 0.3),
        0 8px 24px rgba(0,0,0,0.4);
    }

    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #F1F5F9;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #475569;
      font-size: 14px;
      font-weight: 400;
      margin-bottom: 36px;
    }

    .input-wrap {
      position: relative;
      margin-bottom: 16px;
    }
    .input-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #3D4E63;
      pointer-events: none;
      font-size: 16px;
    }
    input {
      width: 100%;
      padding: 15px 18px 15px 42px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 14px;
      color: #F1F5F9;
      font-size: 16px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input::placeholder { color: #2D3A4A; }
    input:focus {
      border-color: rgba(56, 189, 248, 0.45);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.08);
    }
    input:disabled { opacity: 0.6; }

    button[type="submit"] {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(56, 189, 248, 0.35), 0 2px 6px rgba(0,0,0,0.3);
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      letter-spacing: -0.1px;
    }
    button[type="submit"]:active {
      transform: scale(0.97);
      box-shadow: 0 2px 10px rgba(56, 189, 248, 0.25);
    }
    button[type="submit"]:disabled {
      opacity: 0.6;
      transform: none;
    }

    .error {
      margin-top: 16px;
      padding: 12px 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 12px;
      color: #FCA5A5;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
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
      <div class="bg-blob bg-blob-1"></div>
      <div class="bg-blob bg-blob-2"></div>
      <div class="bg-blob bg-blob-3"></div>
      <div class="bg-grid"></div>
      <form class="card" @submit=${this._submit}>
        <div class="logo-wrap">
          <div class="logo-ring"></div>
          <div class="logo">J</div>
        </div>
        <h1>Jarvis</h1>
        <p class="subtitle">Connect to your gateway</p>
        <div class="input-wrap">
          <span class="input-icon">⬤</span>
          <input
            type="password"
            placeholder="Access key"
            autocomplete="current-password"
            ?disabled=${this.loading}>
        </div>
        <button type="submit" ?disabled=${this.loading}>
          ${this.loading ? 'Connecting…' : 'Connect'}
        </button>
        ${this.error ? html`<div class="error">${this.error}</div>` : ''}
      </form>
    `;
  }
}

customElements.define('login-screen', LoginScreen);
