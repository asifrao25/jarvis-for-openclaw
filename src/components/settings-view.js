import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight } from '../services/haptics.js';

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
  `;

  static properties = {
    fontSize: { type: String },
    userColor: { type: String },
    agentColor: { type: String }
  };

  constructor() {
    super();
    this.fontSize = localStorage.getItem('settings-font-size') || '16px';
    this.userColor = localStorage.getItem('settings-user-color') || '#00FFFF';
    this.agentColor = localStorage.getItem('settings-agent-color') || '#E0FFFF';
    this._applySettings();
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
    if (confirm(`Clear all ${category} entries?`)) {
      this.dispatchEvent(new CustomEvent('clear-category', { 
        detail: category, 
        bubbles: true, 
        composed: true 
      }));
      hapticMedium();
    }
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
        <div class="section-title">Data Management</div>
        <div class="control-group">
          <button class="clear-btn" @click=${() => this._clear('chat')}>Clear Chat History</button>
          <button class="clear-btn" @click=${() => this._clear('alert')}>Clear Alerts</button>
          <button class="clear-btn" @click=${() => this._clear('report')}>Clear Reports</button>
        </div>
        <div class="hint">// Actions cannot be undone</div>
      </div>
    `;
  }
}

customElements.define('settings-view', SettingsView);
