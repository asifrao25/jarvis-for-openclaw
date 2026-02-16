import { LitElement, html, css } from 'lit';

export class StreamIndicator extends LitElement {
  static styles = css`
    :host { display: block; padding: 12px 16px; }
    .indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .dots {
      display: flex;
      gap: 4px;
    }
    .dots span {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #3b82f6;
      animation: pulse 1.4s infinite ease-in-out both;
    }
    .dots span:nth-child(1) { animation-delay: -0.32s; }
    .dots span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes pulse {
      0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Thinking mode: brain icon + slower pulse */
    :host([mode="thinking"]) .dots span {
      background: #8b5cf6;
      animation-duration: 1.8s;
    }
  `;

  static properties = {
    mode: { type: String, reflect: true },
  };

  constructor() {
    super();
    this.mode = 'streaming'; // 'thinking' or 'streaming'
  }

  render() {
    const label = this.mode === 'thinking' ? 'Thinking...' : 'Responding...';
    return html`
      <div class="indicator">
        <div class="dots"><span></span><span></span><span></span></div>
        <span>${label}</span>
      </div>
    `;
  }
}

customElements.define('stream-indicator', StreamIndicator);
