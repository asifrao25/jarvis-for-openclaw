import { LitElement, html, css } from 'lit';

export class StreamIndicator extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 4px 14px 8px;
    }

    .bubble {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: rgba(8,13,20,.78);
      border: 1px solid rgba(0,255,238,.10);
      border-radius: 3px 14px 14px 14px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0,0,0,.3), inset 0 1px 0 rgba(0,255,238,.06);
    }

    .dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .dots span {
      display: inline-block;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #00ffee;
      opacity: .3;
      animation: wave 1.3s ease-in-out infinite;
    }
    .dots span:nth-child(1) { animation-delay: 0s; }
    .dots span:nth-child(2) { animation-delay: 0.18s; }
    .dots span:nth-child(3) { animation-delay: 0.36s; }

    @keyframes wave {
      0%, 80%, 100% { transform: translateY(0) scale(0.85); opacity: .3; }
      40% { transform: translateY(-4px) scale(1); opacity: 1; box-shadow: 0 0 6px #00ffee; }
    }

    .label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: .06em;
      color: #4a6e82;
    }
  `;

  static properties = {
    mode: { type: String, reflect: true },
  };

  constructor() {
    super();
    this.mode = 'streaming';
  }

  render() {
    const label = this.mode === 'thinking' ? 'Thinking…' : 'Responding…';
    return html`
      <div class="bubble">
        <div class="dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="label">${label}</span>
      </div>
    `;
  }
}

customElements.define('stream-indicator', StreamIndicator);
