import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight } from '../services/haptics.js';
import './message-item.js';

export class ChatView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      flex: 1;
      min-height: 0;
      position: relative;
      background: transparent;
    }

    .messages {
      flex: 1;
      overflow-y: scroll;
      -webkit-overflow-scrolling: touch;
      padding: 15px 20px;
      /* Ensure last message is above the input bar when visible */
      padding-bottom: 120px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      touch-action: pan-y;
      transition: padding 0.3s ease;
    }
    
    :host([ui-hidden]) .messages {
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }

    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); border-radius: 2px; }

    .input-area {
      flex-shrink: 0;
      /* Using full width up to the 50px FAB zone on the right, removed left button padding */
      padding: 0 50px 0 12px;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      background: #000;
      border-top: 1px solid rgba(0, 255, 255, 0.15);
      display: flex;
      align-items: center;
      z-index: 30;
      overflow: hidden;
      min-height: 56px;
      box-sizing: border-box;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host([ui-hidden]) .input-area {
      height: 0;
      min-height: 0;
      opacity: 0;
      pointer-events: none;
      border-top-color: transparent;
    }

    input {
      flex: 1;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 10px;
      padding: 10px 15px;
      height: 40px;
      color: var(--c-primary);
      font-family: var(--f-body);
      font-size: 16px;
      outline: none;
      -webkit-appearance: none;
      box-sizing: border-box;
      width: 100%;
    }

    input:focus {
      border-color: var(--c-primary);
      background: rgba(0, 255, 255, 0.1);
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
      padding: 60px 0;
    }
    
    .logo-spin {
      width: 50px; height: 50px;
      border: 2px solid var(--c-primary);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 3s linear infinite;
      margin-bottom: 20px;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  static properties = {
    messages: { type: Array },
    thinking: { type: Boolean },
    uiHidden: { type: Boolean, reflect: true, attribute: 'ui-hidden' },
  };

  constructor() {
    super();
    this._lastScrollTop = 0;
    this._touchStartY = 0;
    this.uiHidden = false;
    this._isAutoScrolling = false;
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.messages');
    const input = this.shadowRoot.querySelector('input');

    this.scrollToBottom();

    el.addEventListener('scroll', () => {
      if (this._isAutoScrolling) return;

      const st = el.scrollTop;
      const diff = st - this._lastScrollTop;
      const distFromBottom = el.scrollHeight - st - el.clientHeight;
      
      if (Math.abs(diff) > 5) {
        let shouldHide = this.uiHidden;
        if (diff < -15 && st > 100) {
          shouldHide = true;
        } else if (diff > 10 || distFromBottom < 40 || st < 20) {
          shouldHide = false;
        }
        
        if (shouldHide !== this.uiHidden) {
          this.uiHidden = shouldHide;
          this.dispatchEvent(new CustomEvent('ui-toggle', { 
            detail: shouldHide, 
            bubbles: true, 
            composed: true 
          }));
        }
      }
      this._lastScrollTop = st;
    }, { passive: true });

    el.addEventListener('touchstart', (e) => {
      this._touchStartY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - this._touchStartY;
      if (deltaY > 60) {
        if (this.shadowRoot.activeElement === input) {
          input.blur();
          hapticLight();
        }
      }
    }, { passive: true });
  }

  updated(changed) {
    if (changed.has('messages')) {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    const el = this.shadowRoot.querySelector('.messages');
    if (el) {
      this._isAutoScrolling = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
          this._lastScrollTop = el.scrollTop;
          setTimeout(() => { this._isAutoScrolling = false; }, 150);
        });
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
            <div>WAITING FOR COMMAND</div>
          </div>
        ` : ''}
        
        ${this.messages.map(m => html`
          <message-item .role=${m.role} .text=${m.text} .timestamp=${m.timestamp}></message-item>
        `)}
        
        ${this.thinking ? html`<div style="color:var(--c-primary); font-family:var(--f-mono); margin-left:10px; font-size:12px; letter-spacing:1px; margin-bottom: 20px;">ANALYZING...</div>` : ''}
      </div>

      <form class="input-area" @submit=${this._send}>
        <input type="text" placeholder="ENTER COMMAND..." autocomplete="off" @focus=${() => { 
          this.uiHidden = false;
          this.dispatchEvent(new CustomEvent('ui-toggle', { detail: false, bubbles: true, composed: true }));
        }}>
      </form>
    `;
  }
}

customElements.define('chat-view', ChatView);
