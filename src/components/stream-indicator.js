import { LitElement, html, css } from 'lit';

export class StreamIndicator extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 4px 14px 8px;
      animation: fadeUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .bubble {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 5px 18px 18px 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }

    /* Three dots */
    .dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .dots span {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      animation: wave 1.4s ease-in-out infinite;
    }
    .dots span:nth-child(1) { animation-delay: 0s; }
    .dots span:nth-child(2) { animation-delay: 0.18s; }
    .dots span:nth-child(3) { animation-delay: 0.36s; }

    @keyframes wave {
      0%, 60%, 100% {
        transform: translateY(0) scale(0.85);
        opacity: 0.35;
      }
      30% {
        transform: translateY(-5px) scale(1);
        opacity: 1;
      }
    }

    /* Thinking mode — violet/purple */
    :host([mode="thinking"]) .dots span {
      background: #A78BFA;
      box-shadow: 0 0 8px rgba(167, 139, 250, 0.5);
      animation-duration: 1.7s;
    }
    :host([mode="thinking"]) .label {
      font-size: 12px;
      font-weight: 500;
      color: #A78BFA;
      letter-spacing: 0.1px;
    }

    /* Streaming mode — sky blue */
    :host([mode="streaming"]) .dots span {
      background: #38BDF8;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
      animation-duration: 1.1s;
    }
    :host([mode="streaming"]) .label {
      font-size: 12px;
      font-weight: 500;
      color: #38BDF8;
      letter-spacing: 0.1px;
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
