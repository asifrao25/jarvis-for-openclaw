import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight } from '../services/haptics.js';

export class AlertView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      background: transparent;
      flex: 1;
      min-height: 0;
    }

    .pull-indicator {
      position: absolute;
      top: 0; left: 0; right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 0;
      overflow: hidden;
      transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
      color: #4a6e82;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: .08em;
      gap: 8px;
    }
    .pull-indicator.pulling { transition: none; }
    .pull-indicator.refreshing { height: 48px; }
    .pull-spinner {
      width: 14px; height: 14px;
      border: 1.5px solid rgba(255,77,109,.2);
      border-top-color: #FF4D6D;
      border-radius: 50%;
    }
    .pull-indicator.refreshing .pull-spinner { animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pull-arrow { font-size: 13px; opacity: 0.5; }
    .pull-arrow.ready { transform: rotate(180deg); }

    .clear-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 6px 16px 2px;
      flex-shrink: 0;
    }
    .clear-btn {
      background: transparent;
      border: 1px solid rgba(255,77,109,.20);
      color: #4a6e82;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      transition: all .2s;
    }
    .clear-btn:active {
      color: #FF4D6D;
      border-color: rgba(255,77,109,.4);
      background: rgba(255,77,109,.06);
    }

    .entries {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 8px 14px 16px;
      overscroll-behavior-y: contain;
    }
    .entries::-webkit-scrollbar { display: none; }

    .entry {
      margin: 6px 0;
      border-radius: 12px;
      background: rgba(255,77,109,.04);
      border: 1px solid rgba(255,77,109,.12);
      border-left: 2px solid rgba(255,77,109,.55);
      overflow: hidden;
    }
    .entry-header {
      display: flex;
      align-items: center;
      padding: 13px 14px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      gap: 12px;
    }
    .entry-header:active { opacity: 0.7; }

    .entry-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: rgba(255,77,109,.08);
      border: 1px solid rgba(255,77,109,.18);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .entry-icon svg { width: 16px; height: 16px; fill: #FF4D6D; }

    .entry-info { flex: 1; min-width: 0; }
    .entry-title {
      font-size: 13px;
      font-weight: 600;
      color: #FECDD3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .entry-time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      letter-spacing: .04em;
      color: #2a3f50;
      margin-top: 3px;
    }

    .entry-chevron { flex-shrink: 0; transition: transform 0.2s ease; }
    .entry-chevron svg { width: 16px; height: 16px; fill: #4a6e82; }
    .entry.expanded .entry-chevron { transform: rotate(180deg); }

    .entry-body {
      display: none;
      padding: 2px 14px 14px;
      border-top: 1px solid rgba(255,77,109,.10);
    }
    .entry.expanded .entry-body { display: block; }
    .entry-text {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: #94A3B8;
      white-space: pre-wrap;
      word-break: break-word;
      padding-top: 10px;
    }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 14px;
      padding: 32px;
    }
    .empty-icon {
      width: 60px; height: 60px;
      border-radius: 50%;
      border: 1px solid rgba(255,77,109,.18);
      background: rgba(255,77,109,.04);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-icon svg { width: 26px; height: 26px; fill: #4a6e82; }
    .empty-text {
      font-family: 'Orbitron', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #4a6e82;
      letter-spacing: .2em;
      text-transform: uppercase;
    }
    .empty-hint {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #2a3f50;
      text-align: center;
      letter-spacing: .03em;
    }

    .scroll-bottom {
      position: absolute;
      bottom: 16px; right: 16px;
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(8,13,20,.92);
      border: 1px solid rgba(255,77,109,.20);
      color: #FF4D6D;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 20;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .scroll-bottom:active { opacity: 0.7; }
    .scroll-bottom svg { width: 18px; height: 18px; fill: currentColor; }

    /* Action Menu Styles */
    .action-menu {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: rgba(0, 20, 30, 0.98);
      border: 1px solid var(--c-primary);
      border-radius: 8px;
      padding: 4px 8px;
      display: flex;
      gap: 4px;
      z-index: 120;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(15px);
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
      white-space: nowrap;
      width: max-content;
    }

    .action-menu.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, -50%) scale(1);
    }

    .action-btn {
      background: transparent;
      border: none;
      color: var(--c-primary);
      font-family: var(--f-mono);
      font-size: 11px;
      padding: 10px 14px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .action-btn:active {
      background: rgba(0, 255, 255, 0.1);
    }

    .action-btn.delete {
      color: var(--c-alert);
    }

    .copy-toast {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--c-primary);
      color: #fff;
      font-family: var(--f-mono);
      font-size: 12px;
      font-weight: 900;
      padding: 6px 16px;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
      z-index: 200;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
      letter-spacing: 1px;
    }

    .copy-toast.visible {
      opacity: 1;
      transform: translate(-50%, -100px);
    }

    .copy-toast.delete {
      background: var(--c-alert);
      color: #fff;
      box-shadow: 0 0 20px rgba(255, 51, 51, 0.4);
    }
  `;

  static properties = {
    messages:       { type: Array },
    _pullState:     { type: String,  state: true },
    _pullHeight:    { type: Number,  state: true },
    _showScrollBtn: { type: Boolean, state: true },
    _expanded:      { type: Object,  state: true },
    _menuOpen:      { type: Boolean, state: true },
    _activeKey:     { type: String,  state: true },
    _showCopied:    { type: Boolean, state: true },
    _toastText:     { type: String,  state: true },
    _isDeleteToast: { type: Boolean, state: true },
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
    this._menuOpen = false;
    this._activeKey = null;
    this._showCopied = false;
    this._toastText = 'COPIED';
    this._isDeleteToast = false;
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.entries');
    if (!el) return;

    el.addEventListener('scroll', () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      this._showScrollBtn = distFromBottom > 150;
    }, { passive: true });

    el.addEventListener('touchstart', (e) => {
      if (el.scrollTop <= 0) { this._touchStartY = e.touches[0].clientY; this._pulling = true; }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!this._pulling || this._pullState === 'refreshing') return;
      const dy = e.touches[0].clientY - this._touchStartY;
      if (dy > 0 && el.scrollTop <= 0) {
        const pull = Math.min(dy * 0.5, 80);
        this._pullHeight = pull;
        this._pullState = pull >= 60 ? 'ready' : 'pulling';
        if (pull >= 60 && this._pullState === 'ready') hapticLight();
      } else { this._pullHeight = 0; this._pullState = 'idle'; }
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
      } else { this._pullState = 'idle'; this._pullHeight = 0; }
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
    if (this._menuOpen) {
      this._menuOpen = false;
      return;
    }
    hapticLight();
    this._expanded = { ...this._expanded, [key]: !this._expanded[key] };
  }

  _handleLongPress(e, key) {
    e.preventDefault();
    this._activeKey = String(key);
    this._menuOpen = true;
    hapticMedium();
  }

  async _copy() {
    const msg = this.messages.find(m => String(m.id || m.timestamp) === this._activeKey);
    if (!msg) return;

    try {
      await navigator.clipboard.writeText(msg.text);
      this._toastText = 'COPIED';
      this._isDeleteToast = false;
      this._showCopied = true;
      
      const { hapticSuccess } = await import('../services/haptics.js');
      hapticSuccess();
      
      setTimeout(() => {
        this._showCopied = false;
        this._menuOpen = false;
      }, 1200);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  _delete() {
    const msg = this.messages.find(m => String(m.id || m.timestamp) === this._activeKey);
    if (!msg) return;

    this._toastText = 'DELETED';
    this._isDeleteToast = true;
    this._showCopied = true;
    hapticMedium();

    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('delete-message', {
        detail: { id: msg.id, timestamp: msg.timestamp },
        bubbles: true,
        composed: true
      }));
      this._showCopied = false;
      this._menuOpen = false;
    }, 800);
  }

  _getSummary(text) {
    const stripped = text.replace(/^\[ALERT\]\s*/, '');
    const firstLine = stripped.split('\n')[0].trim();
    return firstLine.length > 80 ? firstLine.substring(0, 77) + '…' : firstLine;
  }

  _getBody(text) { return text.replace(/^\[ALERT\]\s*/, ''); }

  _formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return time;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
  }

  render() {
    const alerts = this.messages.filter(m => m.category === 'alert');

    const pullClasses = ['pull-indicator'];
    if (this._pullState === 'pulling' || this._pullState === 'ready') pullClasses.push('pulling');
    if (this._pullState === 'refreshing') pullClasses.push('refreshing');
    const pullStyle = (this._pullState === 'pulling' || this._pullState === 'ready')
      ? `height: ${this._pullHeight}px` : '';

    return html`
      <div class="copy-toast ${this._showCopied ? 'visible' : ''} ${this._isDeleteToast ? 'delete' : ''}">
        ${this._toastText}
      </div>

      <div class=${pullClasses.join(' ')} style=${pullStyle}>
        ${this._pullState === 'refreshing' ? html`
          <div class="pull-spinner"></div><span>Refreshing</span>
        ` : html`
          <span class="pull-arrow ${this._pullState === 'ready' ? 'ready' : ''}">↓</span>
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
            <div class="empty-hint">// system alerts will appear here</div>
          </div>
        ` : ''}
        ${alerts.map((m, i) => {
          const key = String(m.id || m.timestamp || i);
          const expanded = this._expanded[key];
          return html`
            <div class="entry ${expanded ? 'expanded' : ''}" style="position: relative;">
              <div class="entry-header" 
                   @click=${() => this._toggle(key)}
                   @contextmenu=${(e) => this._handleLongPress(e, key)}>
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

              <div class="action-menu ${this._menuOpen && this._activeKey === key ? 'visible' : ''}" @click=${(e) => e.stopPropagation()}>
                <button class="action-btn" @click=${this._copy}>Copy</button>
                <button class="action-btn delete" @click=${this._delete}>Delete</button>
                <button class="action-btn" @click=${() => this._menuOpen = false}>Close</button>
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
      ${this._menuOpen ? html`<div style="position:fixed; inset:0; z-index:90;" @click=${() => this._menuOpen = false}></div>` : ''}
    `;
  }
}

customElements.define('alert-view', AlertView);
