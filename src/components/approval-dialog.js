import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticSuccess, hapticError } from '../services/haptics.js';

/**
 * ApprovalDialog - Exec approval popup for Jarvis PWA
 * Styled with cyan neon cyberpunk theme to match app-shell
 */
export class ApprovalDialog extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(10px);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog {
      background: linear-gradient(145deg, #000810 0%, #001520 100%);
      border: 1px solid rgba(0, 255, 255, 0.4);
      border-radius: 12px;
      padding: 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 
        0 0 60px rgba(0, 255, 255, 0.2),
        inset 0 0 40px rgba(0, 255, 255, 0.05);
      position: relative;
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes slideUp {
      from { 
        opacity: 0; 
        transform: translateY(30px) scale(0.95); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }

    /* Scanline effect */
    .dialog::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--c-primary), transparent);
      animation: scanline 3s linear infinite;
    }

    @keyframes scanline {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }

    /* Corner accents */
    .corner {
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid var(--c-primary);
    }
    .corner-tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
    .corner-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
    .corner-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
    .corner-br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(0, 255, 255, 0.15);
    }

    .warning-icon {
      width: 48px;
      height: 48px;
      border: 2px solid var(--c-alert);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 51, 51, 0.1);
      box-shadow: 0 0 20px rgba(255, 51, 51, 0.3);
      animation: pulseWarning 2s ease-in-out infinite;
    }

    @keyframes pulseWarning {
      0%, 100% { box-shadow: 0 0 20px rgba(255, 51, 51, 0.3); }
      50% { box-shadow: 0 0 30px rgba(255, 51, 51, 0.5); }
    }

    .warning-icon svg {
      width: 24px;
      height: 24px;
      fill: var(--c-alert);
    }

    .title-section {
      flex: 1;
    }

    .title {
      font-family: var(--f-display);
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--c-alert);
      text-transform: uppercase;
      margin: 0 0 4px 0;
      text-shadow: 0 0 10px rgba(255, 51, 51, 0.5);
    }

    .subtitle {
      font-family: var(--f-mono);
      font-size: 10px;
      letter-spacing: 1.5px;
      color: var(--c-text-dim);
      text-transform: uppercase;
    }

    .info-grid {
      display: grid;
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-family: var(--f-mono);
      font-size: 9px;
      letter-spacing: 1.5px;
      color: var(--c-primary);
      opacity: 0.7;
      text-transform: uppercase;
    }

    .info-value {
      font-family: var(--f-mono);
      font-size: 11px;
      color: var(--c-text);
    }

    .command-box {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--f-mono);
      font-size: 11px;
      line-height: 1.5;
      color: #00FFFF;
      word-break: break-all;
      max-height: 120px;
      overflow-y: auto;
      position: relative;
    }

    .command-box::-webkit-scrollbar {
      width: 3px;
    }
    .command-box::-webkit-scrollbar-thumb {
      background: rgba(0, 255, 255, 0.3);
      border-radius: 2px;
    }

    .command-label {
      position: absolute;
      top: -8px;
      left: 12px;
      background: #001520;
      padding: 0 8px;
      font-family: var(--f-mono);
      font-size: 9px;
      letter-spacing: 1px;
      color: var(--c-primary);
    }

    .timeout-bar {
      height: 2px;
      background: rgba(0, 255, 255, 0.1);
      margin: 20px 0;
      border-radius: 1px;
      overflow: hidden;
    }

    .timeout-progress {
      height: 100%;
      background: linear-gradient(90deg, var(--c-primary), var(--c-alert));
      transition: width 1s linear;
    }

    .buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .button-row {
      display: flex;
      gap: 10px;
    }

    button {
      flex: 1;
      padding: 14px;
      border: 1px solid;
      border-radius: 6px;
      font-family: var(--f-display);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
    }

    button:active {
      transform: scale(0.97);
    }

    .btn-deny {
      background: rgba(255, 51, 51, 0.1);
      border-color: var(--c-alert);
      color: var(--c-alert);
    }
    .btn-deny:hover {
      background: rgba(255, 51, 51, 0.2);
      box-shadow: 0 0 20px rgba(255, 51, 51, 0.3);
    }

    .btn-allow-once {
      background: rgba(0, 255, 255, 0.15);
      border-color: var(--c-primary);
      color: var(--c-primary);
    }
    .btn-allow-once:hover {
      background: rgba(0, 255, 255, 0.25);
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    }

    .btn-allow-always {
      background: transparent;
      border-color: rgba(0, 255, 255, 0.4);
      color: rgba(0, 255, 255, 0.8);
      font-size: 11px;
    }
    .btn-allow-always:hover {
      background: rgba(0, 255, 255, 0.1);
      border-color: var(--c-primary);
      color: var(--c-primary);
    }

    .meta-info {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 255, 255, 0.1);
    }

    .meta-item {
      font-family: var(--f-mono);
      font-size: 9px;
      color: var(--c-text-dim);
      letter-spacing: 0.5px;
    }

    .meta-item span {
      color: var(--c-primary);
    }

    /* Desktop enhancements */
    @media (min-width: 1024px) {
      .dialog {
        max-width: 480px;
        padding: 32px;
      }
      .title {
        font-size: 22px;
      }
      button {
        padding: 16px;
        font-size: 14px;
      }
    }
  `;

  static properties = {
    approvalId: { type: String },
    command: { type: String },
    agentId: { type: String },
    host: { type: String },
    timeoutMs: { type: Number },
    _timeRemaining: { type: Number, state: true },
  };

  constructor() {
    super();
    this.timeoutMs = 60000; // Default 60s
    this._timeRemaining = 100;
    this._timerInterval = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._startTimer();
    hapticError(); // Warning vibration
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopTimer();
  }

  _startTimer() {
    const startTime = Date.now();
    this._timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      this._timeRemaining = Math.max(0, 100 - (elapsed / this.timeoutMs * 100));
      
      if (this._timeRemaining <= 0) {
        this._respond('timeout');
      }
    }, 1000);
  }

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  _respond(decision) {
    this._stopTimer();
    
    if (decision === 'allow-once' || decision === 'allow-always') {
      hapticSuccess();
    } else if (decision === 'deny') {
      hapticError();
    }

    this.dispatchEvent(new CustomEvent('approval-response', {
      detail: { 
        approvalId: this.approvalId, 
        decision,
        command: this.command,
        agentId: this.agentId
      },
      bubbles: true,
      composed: true
    }));
  }

  _formatCommand(cmd) {
    if (!cmd) return '';
    // Truncate very long commands
    if (cmd.length > 300) {
      return cmd.substring(0, 300) + '...';
    }
    return cmd;
  }

  render() {
    return html`
      <div class="dialog">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>

        <div class="header">
          <div class="warning-icon">
            <svg viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
          <div class="title-section">
            <h2 class="title">EXEC APPROVAL</h2>
            <div class="subtitle">Host Command Execution Required</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Agent</span>
            <span class="info-value">${this.agentId || 'Unknown'}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Target Host</span>
            <span class="info-value">${this.host || 'gateway'}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Command</span>
            <div class="command-box">
              <span class="command-label">SHELL</span>
              ${this._formatCommand(this.command)}
            </div>
          </div>
        </div>

        <div class="timeout-bar">
          <div class="timeout-progress" style="width: ${this._timeRemaining}%"></div>
        </div>

        <div class="buttons">
          <div class="button-row">
            <button class="btn-deny" @click=${() => this._respond('deny')}>
              DENY
            </button>
            <button class="btn-allow-once" @click=${() => this._respond('allow-once')}>
              ALLOW ONCE
            </button>
          </div>
          <button class="btn-allow-always" @click=${() => this._respond('allow-always')}>
            ALWAYS ALLOW THIS COMMAND
          </button>
        </div>

        <div class="meta-info">
          <div class="meta-item">ID: <span>${this.approvalId?.substring(0, 8) || 'N/A'}...</span></div>
          <div class="meta-item">Timeout: <span>${Math.ceil(this._timeRemaining / 100 * (this.timeoutMs / 1000))}s</span></div>
        </div>
      </div>
    `;
  }
}

customElements.define('approval-dialog', ApprovalDialog);
