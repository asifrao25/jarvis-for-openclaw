import { LitElement, html, css } from 'lit';
import { hapticMedium } from '../services/haptics.js';
import './message-item.js';

export class ChatView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      position: relative;
      flex: 1;
      min-height: 0;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overscroll-behavior-y: contain;
      min-height: 0;
    }
    
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); border-radius: 2px; }

    .input-area {
      flex-shrink: 0;
      padding: 10px;
      background: rgba(0, 0, 0, 0.9);
      border-top: 1px solid rgba(0, 255, 255, 0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    input {
      flex: 1;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 4px;
      padding: 12px;
      color: var(--c-primary);
      font-family: var(--f-body);
      font-size: 16px;
      outline: none;
      transition: all 0.3s;
    }

    input:focus {
      border-color: var(--c-primary);
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
      background: rgba(0, 255, 255, 0.1);
    }

    button {
      background: var(--c-primary-dim);
      border: none;
      border-radius: 4px;
      padding: 12px;
      color: #000;
      font-weight: bold;
      cursor: pointer;
      font-family: var(--f-mono);
      text-transform: uppercase;
      transition: background 0.3s;
    }
    
    button:active {
      transform: scale(0.95);
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--c-text-dim);
      font-family: var(--f-mono);
      opacity: 0.5;
    }
    
    .logo-spin {
      width: 60px; height: 60px;
      border: 2px solid var(--c-primary);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 2s linear infinite;
      margin-bottom: 20px;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  static properties = {
    messages: { type: Array },
    thinking: { type: Boolean },
    streaming: { type: Boolean },
  };

  updated(changed) {
    if (changed.has('messages')) {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    const el = this.shadowRoot.querySelector('.messages');
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }

  _send(e) {
    e.preventDefault();
    const input = this.shadowRoot.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    
    hapticMedium();
    this.dispatchEvent(new CustomEvent('send-message', { detail: text, bubbles: true, composed: true }));
    input.value = '';
  }

  render() {
    return html`
      <div class="messages">
        ${this.messages.length === 0 ? html`
          <div class="empty-state">
            <div class="logo-spin"></div>
            <div>// JARVIS ONLINE</div>
            <div>WAITING FOR INPUT...</div>
          </div>
        ` : ''}
        
        ${this.messages.map(m => html`
          <message-item .role=${m.role} .text=${m.text} .timestamp=${m.timestamp}></message-item>
        `)}
        
        ${this.thinking ? html`<div style="color:var(--c-primary); font-family:var(--f-mono); margin-left:10px;">PROCESSING...</div>` : ''}
      </div>

      <form class="input-area" @submit=${this._send}>
        <input type="text" placeholder="COMMAND JARVIS..." autocomplete="off">
        <button type="submit">SEND</button>
      </form>
    `;
  }
}

customElements.define('chat-view', ChatView);
