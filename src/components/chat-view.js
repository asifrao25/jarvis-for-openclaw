import { LitElement, html, css } from 'lit';
import { hapticMedium, hapticLight, hapticSuccess, hapticError } from '../services/haptics.js';
import { getAuth } from '../services/auth.js';
import './message-item.js';
import './stream-indicator.js';

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
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      padding: 15px 20px;
      padding-bottom: 44px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      touch-action: pan-y;
      transition: padding 0.3s ease;
      width: 100%;
      box-sizing: border-box;
    }
    
    :host([ui-hidden]) .messages {
      padding-bottom: 10px;
    }

    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); border-radius: 2px; }

    .input-area-container {
      flex-shrink: 0;
      background: #000;
      border-top: 1px solid rgba(0, 255, 255, 0.15);
      z-index: 30;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .attachment-preview {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      background: rgba(0, 255, 255, 0.05);
      gap: 12px;
      border-bottom: 1px solid rgba(0, 255, 255, 0.1);
      animation: slideUp 0.2s ease-out;
      position: relative;
    }

    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      background: var(--c-primary);
      box-shadow: 0 0 10px var(--c-primary);
      transition: width 0.3s ease;
    }

    .preview-thumb {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: cover;
      background: #000;
      border: 1px solid rgba(0, 255, 255, 0.3);
    }

    .preview-info {
      flex: 1;
      min-width: 0;
    }

    .preview-name {
      font-family: var(--f-mono);
      font-size: 11px;
      color: var(--c-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-status {
      font-family: var(--f-mono);
      font-size: 9px;
      color: var(--c-primary);
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .remove-attach {
      background: rgba(255, 51, 51, 0.1);
      border: 1px solid rgba(255, 51, 51, 0.3);
      color: #FF3333;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .input-area {
      padding: 0 50px 0 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      min-height: 44px;
      box-sizing: border-box;
    }

    @media (min-width: 1024px) {
      .input-area-container {
        position: fixed;
        bottom: 80px;
        left: 0;
        right: 0;
        padding: 0 60px;
        background: #000 !important;
        border-top: 1px solid rgba(0, 255, 255, 0.25);
        z-index: 1000;
      }
      .input-area {
        display: flex;
        align-items: center;
        gap: 15px;
        height: 60px;
      }
      .indicator-container {
        bottom: 140px !important;
      }
      .messages {
        padding-bottom: 160px !important;
      }
    }

    :host([ui-hidden]) .input-area-container {
      height: 0;
      min-height: 0;
      opacity: 0;
      pointer-events: none;
      border-top-color: transparent;
    }

    .attach-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.2);
      color: var(--c-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      transition: all 0.2s;
    }

    .attach-btn:active {
      background: rgba(0, 255, 255, 0.2);
      transform: scale(0.92);
    }

    .attach-btn.has-file {
      background: var(--c-primary);
      color: #000;
      border-color: var(--c-primary);
      box-shadow: 0 0 10px var(--c-primary-dim);
    }

    .attach-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    input[type="text"] {
      flex: 1;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0 12px;
      height: 32px;
      color: var(--c-primary);
      font-family: var(--f-body);
      font-size: 16px;
      outline: none;
      -webkit-appearance: none;
      box-sizing: border-box;
      display: block;
      min-width: 0;
    }

    input[type="text"]:focus {
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

    .scroll-bottom-btn {
      position: absolute;
      bottom: 56px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 30, 40, 0.9);
      border: 1px solid var(--c-primary-dim);
      color: var(--c-primary);
      border-radius: 20px;
      padding: 6px 14px;
      font-family: var(--f-mono);
      font-size: 10px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      z-index: 40;
      backdrop-filter: blur(15px);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, 15px) scale(0.9);
    }

    .scroll-bottom-btn.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
    }

    .indicator-container {
      position: absolute;
      bottom: 44px;
      left: 0;
      width: 100%;
      z-index: 25;
      pointer-events: none;
    }

    .skeleton-message {
      width: 70%;
      height: 40px;
      background: rgba(0, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 255, 0.1);
      border-radius: 8px;
      margin-bottom: 12px;
      position: relative;
      overflow: hidden;
    }

    .skeleton-message::after {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
      animation: skeleton-sweep 1.5s infinite;
    }

    .refresh-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      color: var(--c-primary);
      font-family: var(--f-mono);
      font-size: 10px;
      letter-spacing: 2px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .refresh-indicator.visible {
      opacity: 0.6;
    }
  `;

  static properties = {
    messages: { type: Array },
    thinking: { type: Boolean },
    streaming: { type: Boolean },
    loading: { type: Boolean },
    uiHidden: { type: Boolean, reflect: true, attribute: 'ui-hidden' },
    _showScrollBtn: { type: Boolean, state: true },
    _isPulling: { type: Boolean, state: true },
    _pendingFile: { type: Object, state: true },
    _isUploading: { type: Boolean, state: true },
    _uploadProgress: { type: Number, state: true },
  };

  constructor() {
    super();
    this.thinking = false;
    this.streaming = false;
    this._touchStartY = 0;
    this.uiHidden = false;
    this._isAutoScrolling = false;
    this._showScrollBtn = false;
    this._isPulling = false;
    this.loading = false;
    this._pendingFile = null;
    this._isUploading = false;
    this._uploadProgress = 0;
  }

  firstUpdated() {
    const el = this.shadowRoot.querySelector('.messages');
    setTimeout(() => this.scrollToBottom(false), 50);
    setTimeout(() => this.scrollToBottom(false), 200);

    el.addEventListener('scroll', () => {
      if (this._isAutoScrolling) return;
      const st = el.scrollTop;
      const distFromBottom = el.scrollHeight - st - el.clientHeight;
      this._showScrollBtn = distFromBottom > 300;
    }, { passive: true });

    el.addEventListener('touchstart', (e) => {
      this._touchStartY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - this._touchStartY;
      if (el.scrollTop === 0 && deltaY > 40) {
        this._isPulling = true;
      }
      if (deltaY > 60) {
        const input = this.shadowRoot.querySelector('input[type="text"]');
        if (this.shadowRoot.activeElement === input) {
          input.blur();
          hapticLight();
        }
      }
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      if (this._isPulling) {
        hapticMedium();
        this.dispatchEvent(new CustomEvent('refresh', { bubbles: true, composed: true }));
        this._isPulling = false;
      }
    }, { passive: true });
  }

  updated(changed) {
    if (changed.has('messages')) {
      const oldMessages = changed.get('messages') || [];
      if (this.messages.length > oldMessages.length) {
        this.scrollToBottom(false);
        setTimeout(() => this.scrollToBottom(false), 100);
        setTimeout(() => this.scrollToBottom(false), 300);
      }
    }
    if ((changed.has('thinking') && this.thinking) || (changed.has('streaming') && this.streaming)) {
      this.scrollToBottom(false);
    }
  }

  scrollToBottom(smooth = false) {
    const el = this.shadowRoot.querySelector('.messages');
    if (el) {
      this._isAutoScrolling = true;
      if (smooth) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        el.scrollTop = el.scrollHeight;
      }
      setTimeout(() => { this._isAutoScrolling = false; }, smooth ? 500 : 150);
    }
  }

  _triggerFilePicker() {
    this.shadowRoot.querySelector('#file-input').click();
    hapticLight();
  }

  async _compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max = 1600;
          if (width > height) {
            if (width > max) { height *= max / width; width = max; }
          } else {
            if (height > max) { width *= max / height; height = max; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', 0.8) });
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async _handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert('File too large (max 100MB)');
      e.target.value = '';
      return;
    }

    this._isUploading = true;
    this._uploadProgress = 0;
    hapticLight();

    try {
      if (file.type.startsWith('image/')) {
        const { blob, dataUrl } = await this._compressImage(file);
        this._pendingFile = {
          name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
          type: 'image/jpeg',
          blob: blob,
          data: dataUrl 
        };
      } else {
        const reader = new FileReader();
        const data = await new Promise((resolve) => {
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
        this._pendingFile = {
          name: file.name,
          type: file.type,
          blob: file,
          data: data 
        };
      }
      hapticSuccess();
    } catch (err) {
      console.error('File processing failed:', err);
      hapticError();
    } finally {
      this._isUploading = false;
    }
  }

  _removeFile() {
    this._pendingFile = null;
    const fileInput = this.shadowRoot.querySelector('#file-input');
    if (fileInput) fileInput.value = '';
    hapticLight();
  }

  async _send(e) {
    e.preventDefault();
    if (this._isUploading) return;

    const input = this.shadowRoot.querySelector('input[type="text"]');
    const text = input.value.trim();
    
    if (!text && !this._pendingFile) return;
    
    hapticMedium();
    
    if (this._pendingFile) {
      this._isUploading = true;
      this._uploadProgress = 0;
      
      try {
        const formData = new FormData();
        formData.append('file', this._pendingFile.blob, this._pendingFile.name);
        formData.append('sessionKey', 'agent:main:main');
        if (text) formData.append('message', text);

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${location.origin}/pwa/api/upload`);
          xhr.setRequestHeader('x-password', getAuth());
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              this._uploadProgress = Math.round((event.loaded / event.total) * 100);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(xhr.statusText));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });

        hapticSuccess();
        this.dispatchEvent(new CustomEvent('send-message', { 
          detail: { text, attachment: this._pendingFile, skipWebSocket: true }, 
          bubbles: true, 
          composed: true 
        }));

      } catch (err) {
        console.error('[ChatView] Upload error:', err);
        alert('Failed to send media: ' + err.message);
        hapticError();
        this._isUploading = false;
        return;
      }
    } else {
      this.dispatchEvent(new CustomEvent('send-message', { detail: { text }, bubbles: true, composed: true }));
    }

    input.value = '';
    this._pendingFile = null;
    this._isUploading = false;
    this._uploadProgress = 0;
    const fileInput = this.shadowRoot.querySelector('#file-input');
    if (fileInput) fileInput.value = '';
    setTimeout(() => this.scrollToBottom(true), 100);
  }

  render() {
    return html`
      <div class="messages">
        <div class="refresh-indicator ${this._isPulling ? 'visible' : ''}">
          // SYNCING STREAM...
        </div>

        ${this.loading ? html`
          <div class="skeleton-message" style="width: 60%"></div>
          <div class="skeleton-message" style="width: 85%; align-self: flex-end; background: rgba(0, 153, 255, 0.05);"></div>
          <div class="skeleton-message" style="width: 40%"></div>
          <div class="skeleton-message" style="width: 75%"></div>
        ` : ''}

        ${!this.loading && this.messages.length === 0 ? html`
          <div class="empty-state">
            <div class="logo-spin"></div>
            <div>// JARVIS ONLINE</div>
            <div>WAITING FOR COMMAND</div>
          </div>
        ` : ''}
        
        ${this.messages.map(m => html`
          <message-item 
            .msgId=${m.id} 
            .role=${m.role} 
            .text=${m.text} 
            .timestamp=${m.timestamp}
            .seen=${m.seen}
            .attachment=${m.attachment}
          ></message-item>
        `)}
      </div>

      ${this.thinking ? html`
        <div class="indicator-container">
          <stream-indicator mode="thinking"></stream-indicator>
        </div>
      ` : ''}

      <div class="scroll-bottom-btn ${this._showScrollBtn ? 'visible' : ''}" @click=${() => { hapticMedium(); this.scrollToBottom(true); }}>
        <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        <span>NEW MESSAGES BELOW</span>
      </div>

      <div class="input-area-container">
        ${this._isUploading ? html`
          <div class="attachment-preview">
            <div class="progress-bar" style="width: ${this._uploadProgress}%"></div>
            <div class="logo-spin" style="width:20px;height:20px;margin:0;"></div>
            <div class="preview-info">
              <div class="preview-status">
                ${this._uploadProgress < 100 ? `Uploading to Jarvis... ${this._uploadProgress}%` : 'Finalizing Transfer...'}
              </div>
            </div>
          </div>
        ` : ''}

        ${this._pendingFile && !this._isUploading ? html`
          <div class="attachment-preview">
            ${this._pendingFile.type.startsWith('image/') ? html`
              <img class="preview-thumb" src="${this._pendingFile.data}">
            ` : html`
              <div class="preview-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--c-primary)">
                <svg style="width:20px;height:20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
              </div>
            `}
            <div class="preview-info">
              <div class="preview-name">${this._pendingFile.name}</div>
              <div class="preview-status">Ready to sync</div>
            </div>
            <button class="remove-attach" @click=${this._removeFile}>
              <svg style="width:14px;height:14px;" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        ` : ''}
        
        <form class="input-area" @submit=${this._send}>
          <input type="file" id="file-input" style="display: none;" @change=${this._handleFileChange}>
          <button type="button" class="attach-btn ${this._pendingFile ? 'has-file' : ''}" @click=${this._triggerFilePicker} ?disabled=${this._isUploading}>
            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
          <input type="text" placeholder="${this._pendingFile ? 'Type caption...' : 'ENTER COMMAND...'}" autocomplete="off" @focus=${() => { 
            this.uiHidden = false;
            this.dispatchEvent(new CustomEvent('ui-toggle', { detail: false, bubbles: true, composed: true }));
          }}>
        </form>
      </div>
    `;
  }
}

customElements.define('chat-view', ChatView);
