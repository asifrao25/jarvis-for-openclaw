import { LitElement, html, css } from 'lit';

export class SplashScreen extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
    }

    :host(.hiding) {
      opacity: 0;
      pointer-events: none;
    }

    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    /* Radial vignette so grid fades to black at edges */
    .grid::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 30%, #000 100%);
    }

    .content {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      animation: boot 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    }

    @keyframes boot {
      from { opacity: 0; transform: scale(0.88); }
      to   { opacity: 1; transform: scale(1); }
    }

    .ring-wrap {
      position: relative;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ring {
      position: absolute;
      inset: 0;
      border: 2px solid rgba(0, 255, 255, 0.15);
      border-top-color: #00FFFF;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
      box-shadow: 0 0 14px rgba(0, 255, 255, 0.25);
    }

    .ring-inner {
      position: absolute;
      inset: 10px;
      border: 1px solid rgba(0, 255, 255, 0.1);
      border-bottom-color: #00FFFF;
      border-radius: 50%;
      animation: spin 0.6s linear infinite reverse;
    }

    .dot {
      width: 8px;
      height: 8px;
      background: #00FFFF;
      border-radius: 50%;
      box-shadow: 0 0 12px #00FFFF, 0 0 24px rgba(0, 255, 255, 0.4);
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse {
      0%, 100% { opacity: 0.7; transform: scale(0.85); }
      50%       { opacity: 1;   transform: scale(1.15); }
    }

    .logo {
      font-family: 'Orbitron', 'Arial', sans-serif;
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #00FFFF;
      text-shadow:
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 30px rgba(0, 255, 255, 0.4),
        0 0 60px rgba(0, 255, 255, 0.15);
      text-transform: uppercase;
      animation: logo-flicker 4s linear infinite;
    }

    @keyframes logo-flicker {
      0%, 96%, 100% { opacity: 1; }
      97%           { opacity: 0.85; }
      98%           { opacity: 1; }
      99%           { opacity: 0.9; }
    }

    .tagline {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      letter-spacing: 3px;
      color: rgba(0, 255, 255, 0.5);
      text-transform: uppercase;
    }

    .bar-wrap {
      width: 160px;
      height: 2px;
      background: rgba(0, 255, 255, 0.1);
      border-radius: 1px;
      overflow: hidden;
    }

    .bar {
      height: 100%;
      background: #00FFFF;
      box-shadow: 0 0 8px #00FFFF;
      border-radius: 1px;
      animation: fill 0.75s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both;
    }

    @keyframes fill {
      from { width: 0%; }
      to   { width: 100%; }
    }

    .version {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      letter-spacing: 2px;
      color: rgba(0, 255, 255, 0.25);
      text-transform: uppercase;
    }
  `;

  render() {
    return html`
      <div class="grid"></div>
      <div class="content">
        <div class="ring-wrap">
          <div class="ring"></div>
          <div class="ring-inner"></div>
          <div class="dot"></div>
        </div>
        <div class="logo">JARVIS</div>
        <div class="tagline">// SYSTEMS INITIALIZING</div>
        <div class="bar-wrap"><div class="bar"></div></div>
        <div class="version">v${__APP_VERSION__}</div>
      </div>
    `;
  }
}

customElements.define('splash-screen', SplashScreen);
