import { LitElement, html, css } from 'lit';
import { hapticMedium } from '../services/haptics.js';

export class MessageItem extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      margin-bottom: 8px;
      font-family: var(--f-body);
      font-size: 14px;
      line-height: 1.4;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .message-container {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 8px;
      position: relative;
    }
    
    .role-user {
      align-self: flex-end;
      background: rgba(0, 153, 255, 0.2);
      border: 1px solid rgba(0, 153, 255, 0.4);
      color: #E0F7FA;
      box-shadow: 0 0 10px rgba(0, 153, 255, 0.1);
    }

    .role-assistant {
      align-self: flex-start;
      background: rgba(0, 20, 30, 0.8);
      border: 1px solid var(--c-primary-dim);
      color: var(--c-text);
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.05);
    }
    
    .role-assistant::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
      background: var(--c-primary);
      box-shadow: 0 0 8px var(--c-primary);
    }

    .meta {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      text-align: right;
      font-family: var(--f-mono);
    }
  `;

  static properties = {
    role: { type: String },
    text: { type: String },
    timestamp: { type: Number },
  };

  render() {
    return html`
      <div class="message-container role-${this.role}">
        <div class="text">${this.text}</div>
        <div class="meta">${new Date(this.timestamp).toLocaleTimeString()}</div>
      </div>
    `;
  }
}

customElements.define('message-item', MessageItem);
