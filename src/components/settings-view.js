import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight, hapticSuccess, hapticError } from '../services/haptics.js';
import { registerPush } from '../services/push-registration.js';

export class SettingsView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: transparent;
      padding: 20px;
      box-sizing: border-box;
      color: var(--c-primary);
      font-family: var(--f-body);
      overflow-y: auto;
    }

    h2 {
      font-family: var(--f-display);
      font-size: 18px;
      margin-bottom: 20px;
      letter-spacing: 2px;
      border-bottom: 1px solid rgba(0, 255, 255, 0.2);
      padding-bottom: 10px;
    }

    .section {
      margin-bottom: 30px;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.1);
      border-radius: 12px;
      padding: 15px;
    }

    .section-title {
      font-family: var(--f-mono);
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 15px;
      opacity: 0.7;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .control-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      font-size: 14px;
    }

    select, input[type="color"] {
      background: #000;
      border: 1px solid var(--c-primary);
      color: var(--c-primary);
      padding: 5px 10px;
      border-radius: 4px;
      font-family: var(--f-mono);
    }

    .btn-action {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      background: rgba(0, 255, 255, 0.1);
      border: 1px solid var(--c-primary);
      color: var(--c-primary);
      font-family: var(--f-mono);
      font-size: 12px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-action:active {
      background: rgba(0, 255, 255, 0.3);
      transform: scale(0.98);
    }

    .clear-btn {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      background: rgba(255, 51, 51, 0.1);
      border: 1px solid rgba(255, 51, 51, 0.3);
      color: #FF3333;
      font-family: var(--f-mono);
      font-size: 12px;
      text-transform: uppercase;
      cursor: pointer;
      margin-top: 10px;
      transition: all 0.2s;
    }

    .clear-btn:active {
      background: rgba(255, 51, 51, 0.3);
      transform: scale(0.98);
    }

    .hint {
      font-size: 10px;
      opacity: 0.5;
      margin-top: 4px;
      font-family: var(--f-mono);
    }

    .status-badge {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-enabled { background: rgba(0, 255, 0, 0.2); color: #00FF00; }
    .status-disabled { background: rgba(255, 0, 0, 0.2); color: #FF3333; }

    .model-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 255, 255, 0.06);
    }

    .model-row:last-of-type {
      border-bottom: none;
    }

    .model-label {
      font-size: 12px;
      opacity: 0.6;
      font-family: var(--f-mono);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .model-name {
      font-size: 11px;
      font-family: var(--f-mono);
      color: rgba(0, 255, 255, 0.9);
      background: rgba(0, 255, 255, 0.08);
      border: 1px solid rgba(0, 255, 255, 0.15);
      border-radius: 4px;
      padding: 3px 8px;
      max-width: 60%;
      text-align: right;
      word-break: break-all;
    }

    .model-name.unknown {
      color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .models-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }

    .models-refresh {
      font-size: 10px;
      font-family: var(--f-mono);
      color: rgba(0, 255, 255, 0.5);
      background: none;
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 4px;
      padding: 3px 8px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .models-refresh:active { opacity: 0.5; }

    /* Custom Confirmation Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      padding: 20px;
    }

    .modal-overlay.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-content {
      background: #000;
      border: 1px solid var(--c-primary);
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
      border-radius: 16px;
      width: 100%;
      max-width: 320px;
      padding: 24px;
      text-align: center;
      transform: scale(0.9);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .modal-overlay.visible .modal-content {
      transform: scale(1);
    }

    .modal-title {
      font-family: var(--f-display);
      font-size: 16px;
      letter-spacing: 2px;
      color: var(--c-alert);
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    .modal-text {
      font-family: var(--f-mono);
      font-size: 12px;
      line-height: 1.6;
      color: #FFF;
      margin-bottom: 24px;
      opacity: 0.9;
    }

    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .modal-btn {
      padding: 12px;
      border-radius: 8px;
      font-family: var(--f-mono);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: #FFF;
      transition: all 0.2s;
    }

    .modal-btn.confirm {
      background: rgba(255, 51, 51, 0.15);
      border-color: #FF3333;
      color: #FF3333;
      font-weight: bold;
    }

    .modal-btn:active {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.1);
    }
  `;

  static properties = {
    fontSize: { type: String },
    userColor: { type: String },
    agentColor: { type: String },
    pushStatus: { type: String, state: true },
    _confirming: { type: Boolean, state: true },
    _confirmTitle: { type: String, state: true },
    _confirmText: { type: String, state: true },
    _confirmAction: { type: Object, state: true },
    _pendingCategory: { type: String, state: true },
    _models: { type: Object, state: true },
    _modelsLoading: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.fontSize = localStorage.getItem('settings-font-size') || '16px';
    this.userColor = localStorage.getItem('settings-user-color') || '#00FFFF';
    this.agentColor = localStorage.getItem('settings-agent-color') || '#E0FFFF';
    this.pushStatus = Notification.permission;
    this._confirming = false;
    this._confirmTitle = '';
    this._confirmText = '';
    this._confirmAction = null;
    this._pendingCategory = '';
    this._models = null;
    this._modelsLoading = false;
    this._modelsTimer = null;

    // Explicit binding for all platforms
    this._handleConfirm = this._handleConfirm.bind(this);
    this._handleCancel = this._handleCancel.bind(this);
    this._clear = this._clear.bind(this);
    this._logout = this._logout.bind(this);
    this._forceReset = this._forceReset.bind(this);

    this._applySettings();
  }

  connectedCallback() {
    super.connectedCallback();
    this._fetchModels();
    this._modelsTimer = setInterval(() => this._fetchModels(), 30000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._modelsTimer);
  }

  async _fetchModels() {
    this._modelsLoading = true;
    try {
      const res = await fetch('/pwa/api/models');
      if (res.ok) this._models = await res.json();
    } catch {}
    this._modelsLoading = false;
  }

  _forceReset() {
    this._confirmTitle = 'SYSTEM HARD RESET';
    this._confirmText = 'THIS WILL WIPE EVERYTHING:\n- All Messages\n- All Settings\n- Service Worker Caches\n- Local Storage\n\nThe app will reload as if it were a fresh install.';
    this._confirmAction = async () => {
      // 1. Clear IndexedDB
      const dbs = await window.indexedDB.databases();
      dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));
      
      // 2. Clear Caches
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map(key => caches.delete(key)));
      
      // 3. Unregister SWs
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      
      // 4. Clear Local Storage
      localStorage.clear();
      
      // 5. BOOM
      window.location.reload(true);
    };
    this._confirming = true;
  }

  async _enablePush() {
    hapticMedium();
    const ok = await registerPush();
    this.pushStatus = Notification.permission;
    if (ok) hapticSuccess();
    else hapticError();
  }

  _updateFontSize(e) {
    this.fontSize = e.target.value;
    localStorage.setItem('settings-font-size', this.fontSize);
    this._applySettings();
    hapticLight();
  }

  _updateUserColor(e) {
    this.userColor = e.target.value;
    localStorage.setItem('settings-user-color', this.userColor);
    this._applySettings();
  }

  _updateAgentColor(e) {
    this.agentColor = e.target.value;
    localStorage.setItem('settings-agent-color', this.agentColor);
    this._applySettings();
  }

  _applySettings() {
    document.documentElement.style.setProperty('--chat-font-size', this.fontSize);
    document.documentElement.style.setProperty('--chat-user-color', this.userColor);
    document.documentElement.style.setProperty('--chat-agent-color', this.agentColor);
  }

  _clear(category) {
    this._confirmTitle = 'CONFIRM WIPE';
    this._confirmText = `ARE YOU SURE YOU WANT TO CLEAR ALL ${category.toUpperCase()} ENTRIES?\n\nThis action cannot be undone and data will be permanently removed from local storage.`;
    
    // Capture category in the closure immediately
    const targetCategory = category;
    this._confirmAction = () => {
      console.log(`[Settings] Dispatching clear-category: ${targetCategory}`);
      this.dispatchEvent(new CustomEvent('clear-category', { 
        detail: targetCategory, 
        bubbles: true, 
        composed: true 
      }));
      hapticMedium();
    };
    this._confirming = true;
    hapticMedium();
  }

  _logout() {
    this._confirmTitle = 'SYSTEM LOGOUT';
    this._confirmText = 'LOGOUT OF JARVIS?\n\nThis will clear your local session, message history, and sequence tracking. You will need to re-authenticate to use the system.';
    this._confirmAction = () => {
      this.dispatchEvent(new CustomEvent('logout', { bubbles: true, composed: true }));
      hapticMedium();
    };
    this._confirming = true;
    hapticMedium();
  }

  _handleConfirm(e) {
    if (e) e.stopPropagation();
    if (this._confirmAction) {
      this._confirmAction();
    }
    this._confirming = false;
  }

  _handleCancel(e) {
    if (e) e.stopPropagation();
    this._confirming = false;
    hapticLight();
  }

  render() {
    return html`
      <h2>SETTINGS</h2>

      <div class="section">
        <div class="section-title">Visual Configuration</div>
        <div class="control-group">
          <div class="control-item">
            <span class="label">Font Size</span>
            <select @change=${this._updateFontSize}>
              <option value="12px" ?selected=${this.fontSize === '12px'}>Small</option>
              <option value="14px" ?selected=${this.fontSize === '14px'}>Medium</option>
              <option value="16px" ?selected=${this.fontSize === '16px'}>Large</option>
              <option value="18px" ?selected=${this.fontSize === '18px'}>X-Large</option>
            </select>
          </div>
          <div class="control-item">
            <span class="label">User Chat Color</span>
            <input type="color" .value=${this.userColor} @input=${this._updateUserColor}>
          </div>
          <div class="control-item">
            <span class="label">Agent Chat Color</span>
            <input type="color" .value=${this.agentColor} @input=${this._updateAgentColor}>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">System & Notifications</div>
        <div class="control-group">
          <div class="control-item">
            <span class="label">Push Status</span>
            <span class="status-badge ${this.pushStatus === 'granted' ? 'status-enabled' : 'status-disabled'}">
              ${this.pushStatus}
            </span>
          </div>
          ${this.pushStatus !== 'granted' ? html`
            <button class="btn-action" @click=${this._enablePush}>Enable Notifications</button>
          ` : html`
            <div class="hint">Notifications are active for this device</div>
          `}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Models</div>
        ${[
          { key: 'chat',            label: 'Chat (Primary)' },
          { key: 'heartbeatCron',   label: 'Heartbeat Cron' },
          { key: 'heartbeatScript', label: 'Heartbeat Script' },
          { key: 'watchdog',        label: 'MCP Watchdog' },
          { key: 'newsBot',         label: 'News Curator' },
          { key: 'proxmoxReport',   label: 'Proxmox Report' },
          { key: 'orderMonitor',    label: 'Order Monitor' },
          { key: 'proxmoxSecurity', label: 'Proxmox Security' },
        ].map(({ key, label }) => {
          const name = this._models?.[key] ?? '…';
          const isUnknown = !this._models || name === 'unknown';
          return html`
            <div class="model-row">
              <span class="model-label">${label}</span>
              <span class="model-name ${isUnknown ? 'unknown' : ''}">${name}</span>
            </div>`;
        })}
        <div class="models-meta">
          <span class="hint">// live from agent config</span>
          <button class="models-refresh" @click=${() => { hapticLight(); this._fetchModels(); }}>
            ${this._modelsLoading ? '...' : 'refresh'}
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Data Management</div>
        <div class="control-group">
          <button class="clear-btn" @click=${() => this._clear('chat')}>Clear Chat History</button>
          <button class="clear-btn" @click=${() => this._clear('alert')}>Clear Alerts</button>
          <button class="clear-btn" @click=${() => this._clear('report')}>Clear Reports</button>
          <button class="clear-btn" style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); color: #FFF; margin-top: 20px;" @click=${this._logout}>Logout Session</button>
          <button class="clear-btn" style="background: rgba(255,0,0,0.2); border-color: rgba(255,0,0,0.5); color: #FF0000; margin-top: 10px;" @click=${this._forceReset}>Force System Reset</button>
        </div>
        <div class="hint">// Actions cannot be undone</div>
      </div>

      <!-- Custom Confirmation Modal -->
      <div class="modal-overlay ${this._confirming ? 'visible' : ''}" @click=${this._handleCancel}>
        <div class="modal-content" @click=${(e) => e.stopPropagation()}>
          <div class="modal-title">${this._confirmTitle}</div>
          <div class="modal-text">${this._confirmText}</div>
          <div class="modal-actions">
            <button class="modal-btn confirm" @click=${this._handleConfirm}>Confirm Action</button>
            <button class="modal-btn" @click=${this._handleCancel}>Cancel</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('settings-view', SettingsView);
