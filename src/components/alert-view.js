import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight } from '../services/haptics.js';

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

    .clear-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 6px 16px;
    }
    .clear-btn {
      background: none;
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      padding: 5px 12px;
      border-radius: 14px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .clear-btn:active { opacity: 0.7; transform: scale(0.96); }

    .entries {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 8px 16px;
      overscroll-behavior-y: contain;
    }
    .entries::-webkit-scrollbar { width: 4px; }
    .entries::-webkit-scrollbar-track { background: transparent; }
    .entries::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .entry {
      margin: 4px 0;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.06);
      border: 1px solid rgba(239, 68, 68, 0.1);
      overflow: hidden;
      transition: background 0.15s;
    }
    .entry-header {
      display: flex;
      align-items: center;
      padding: 12px 14px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      gap: 10px;
    }
    .entry-header:active { background: rgba(239, 68, 68, 0.1); }
    .entry-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .entry-icon svg { width: 16px; height: 16px; fill: #ef4444; }
    .entry-info {
      flex: 1;
      min-width: 0;
    }
    .entry-title {
      font-size: 14px;
      font-weight: 500;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .entry-time {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .entry-chevron {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    .entry-chevron svg { width: 20px; height: 20px; fill: #475569; }
    .entry.expanded .entry-chevron { transform: rotate(180deg); }

    .entry-body {
      display: none;
      padding: 0 14px 14px;
    }
    .entry.expanded .entry-body { display: block; }
    .entry-text {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      white-space: pre-wrap;
      word-break: break-word;
    }

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

    .scroll-bottom {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.9);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 20;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .scroll-bottom:active { transform: scale(0.9); }
    .scroll-bottom svg { width: 22px; height: 22px; fill: white; }
  `;

  static properties = {
    messages: { type: Array },
    _pullState: { type: String, state: true },
    _pullHeight: { type: Number, state: true },
    _showScrollBtn: { type: Boolean, state: true },
    _expanded: { type: Object, state: true },
  };

  constructor() {
    super();
    this.messages = [];
    this._pullState = 'idle';
    this._pullHeight = 0;
    this._touchStartY = 0;
    this._pulling = false;
    this._showScrollBtn = false;
    this._expanded = {};
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.entries');
    if (!el) return;

    el.addEventListener('scroll', () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      this._showScrollBtn = distFromBottom > 150;
    }, { passive: true });

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

  _scrollToBottom() {
    hapticLight();
    requestAnimationFrame(() => {
      const el = this.shadowRoot.querySelector('.entries');
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  _clearAll() {
    hapticMedium();
    this.dispatchEvent(new CustomEvent('clear-category', { detail: 'alert', bubbles: true, composed: true }));
  }

  _toggle(key) {
    hapticLight();
    this._expanded = { ...this._expanded, [key]: !this._expanded[key] };
  }

  _getSummary(text) {
    const stripped = text.replace(/^\[ALERT\]\s*/, '');
    const firstLine = stripped.split('\n')[0].trim();
    return firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
  }

  _getBody(text) {
    return text.replace(/^\[ALERT\]\s*/, '');
  }

  _formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return time;
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${date}, ${time}`;
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
      ${alerts.length > 0 ? html`
        <div class="clear-bar">
          <button class="clear-btn" @click=${this._clearAll}>Clear All</button>
        </div>
      ` : ''}
      <div class="entries">
        ${alerts.length === 0 ? html`
          <div class="empty">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            <div class="empty-text">No alerts</div>
            <div class="empty-hint">System alerts will appear here</div>
          </div>
        ` : ''}
        ${alerts.map((m, i) => {
          const key = m.id || m.timestamp || i;
          const expanded = this._expanded[key];
          return html`
            <div class="entry ${expanded ? 'expanded' : ''}">
              <div class="entry-header" @click=${() => this._toggle(key)}>
                <div class="entry-icon">
                  <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                </div>
                <div class="entry-info">
                  <div class="entry-title">${this._getSummary(m.text)}</div>
                  <div class="entry-time">${this._formatTime(m.timestamp)}</div>
                </div>
                <div class="entry-chevron">
                  <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                </div>
              </div>
              <div class="entry-body">
                <div class="entry-text">${this._getBody(m.text)}</div>
              </div>
            </div>
          `;
        })}
      </div>
      ${this._showScrollBtn ? html`
        <button class="scroll-bottom" @click=${this._scrollToBottom}>
          <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </button>
      ` : ''}
    `;
  }
}

customElements.define('alert-view', AlertView);
