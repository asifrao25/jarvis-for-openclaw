import { LitElement, html, css } from 'lit';

export class StreamIndicator extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 0;
      animation: slideInUp 0.3s ease-out;
    }

    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 20px;
      background: rgba(0, 15, 25, 0.9);
      border-top: 1px solid rgba(0, 255, 255, 0.2);
      border-left: 3px solid var(--c-primary);
      width: 100%;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
    }

    .container::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.05), transparent);
      transform: translateX(-100%);
      animation: scan 2s linear infinite;
    }

    @keyframes scan {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .scanner {
      width: 18px;
      height: 18px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid rgba(0, 255, 255, 0.2);
      border-top-color: var(--c-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .dot {
      width: 4px;
      height: 4px;
      background: var(--c-primary);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--c-primary);
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    .label {
      font-family: var(--f-mono);
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--c-primary);
      text-transform: uppercase;
      opacity: 0.8;
      display: flex;
      gap: 4px;
    }

    .label span {
      animation: glitch 3s infinite;
    }

    @keyframes glitch {
      0%, 90%, 100% { opacity: 1; transform: translate(0); }
      92% { opacity: 0.5; transform: translate(2px, -1px); }
      94% { opacity: 0.8; transform: translate(-2px, 1px); }
      96% { opacity: 0.3; transform: translate(1px, -2px); }
    }
  `;

  static properties = {
    mode: { type: String },
    label: { type: String },
  };

  constructor() {
    super();
    this.mode = 'thinking';
    this.label = 'Thinking';
  }

  render() {
    return html`
      <div class="container">
        <div class="scanner">
          <div class="ring"></div>
          <div class="dot"></div>
        </div>
        <div class="label">
          // <span>${this.label}</span>...
        </div>
      </div>
    `;
  }
}

customElements.define('stream-indicator', StreamIndicator);
