import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight } from '../services/haptics.js';
import './message-item.js';

export class AlertView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }

    .pull-indicator {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 0;
      overflow: hidden;
      transition: height 0.2s ease;
      z-index: 10;
      background: rgba(239, 68, 68, 0.06);
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
    }
    .pull-indicator.pulling { transition: none; }
    .pull-indicator.refreshing { height: 48px; }
    .pull-indicator .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(239, 68, 68, 0.2);
      border-top-color: #ef4444;
      border-radius: 50%;
      margin-right: 8px;
    }
    .pull-indicator.refreshing .spinner { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pull-arrow { margin-right: 8px; transition: transform 0.2s; font-size: 16px; }
    .pull-arrow.ready { transform: rotate(180deg); }

    .messages {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 12px 0;
      overscroll-behavior-y: contain;
    }
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-track { background: transparent; }
    .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #475569;
      gap: 12px;
    }
    .empty-icon {
      width: 56px;
      height: 56px;
      background: rgba(239, 68, 68, 0.06);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-icon svg { width: 28px; height: 28px; fill: #ef4444; opacity: 0.4; }
    .empty-text { font-size: 15px; font-weight: 500; }
    .empty-hint { font-size: 13px; color: #334155; }
  `;

  static properties = {
    messages: { type: Array },
    _pullState: { type: String, state: true },
    _pullHeight: { type: Number, state: true },
  };

  constructor() {
    super();
    this.messages = [];
    this._pullState = 'idle';
    this._pullHeight = 0;
    this._touchStartY = 0;
    this._pulling = false;
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.messages');
    if (!el) return;

    el.addEventListener('touchstart', (e) => {
      if (el.scrollTop <= 0) {
        this._touchStartY = e.touches[0].clientY;
        this._pulling = true;
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!this._pulling || this._pullState === 'refreshing') return;
      const dy = e.touches[0].clientY - this._touchStartY;
      if (dy > 0 && el.scrollTop <= 0) {
        const pull = Math.min(dy * 0.5, 80);
        this._pullHeight = pull;
        this._pullState = pull >= 60 ? 'ready' : 'pulling';
        if (pull >= 60 && this._pullState === 'ready') hapticLight();
      } else {
        this._pullHeight = 0;
        this._pullState = 'idle';
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      if (!this._pulling) return;
      this._pulling = false;
      if (this._pullState === 'ready') {
        this._pullState = 'refreshing';
        this._pullHeight = 0;
        hapticMedium();
        this.dispatchEvent(new CustomEvent('refresh'));
        setTimeout(() => { this._pullState = 'idle'; }, 1000);
      } else {
        this._pullState = 'idle';
        this._pullHeight = 0;
      }
    }, { passive: true });
  }

  render() {
    const alerts = this.messages.filter(m => m.category === 'alert');

    const pullClasses = ['pull-indicator'];
    if (this._pullState === 'pulling' || this._pullState === 'ready') pullClasses.push('pulling');
    if (this._pullState === 'refreshing') pullClasses.push('refreshing');
    const pullStyle = this._pullState === 'pulling' || this._pullState === 'ready'
      ? `height: ${this._pullHeight}px` : '';

    return html`
      <div class=${pullClasses.join(' ')} style=${pullStyle}>
        ${this._pullState === 'refreshing' ? html`
          <div class="spinner"></div><span>Refreshing...</span>
        ` : html`
          <span class="pull-arrow ${this._pullState === 'ready' ? 'ready' : ''}">&#x2193;</span>
          <span>${this._pullState === 'ready' ? 'Release to refresh' : 'Pull to refresh'}</span>
        `}
      </div>
      <div class="messages">
        ${alerts.length === 0 ? html`
          <div class="empty">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            <div class="empty-text">No alerts</div>
            <div class="empty-hint">System alerts will appear here</div>
          </div>
        ` : ''}
        ${alerts.map(m => html`
          <message-item
            .role=${m.role}
            .text=${m.text}
            .timestamp=${m.timestamp}
            category="alert"
          ></message-item>
        `)}
      </div>
    `;
  }
}

customElements.define('alert-view', AlertView);
