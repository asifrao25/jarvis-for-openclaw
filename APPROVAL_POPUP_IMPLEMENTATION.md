# PWA Exec Approval Popup Implementation

## Summary
Added full-featured exec approval popups to the Jarvis PWA with cyberpunk-themed UI, timeout countdown, and push notification support for background approvals.

## Files Modified

### 1. `/src/components/approval-dialog.js` (NEW)
New component with:
- Full cyberpunk theme matching app-shell design
- Animated corner accents and scanline effect
- Warning icon with pulsing animation
- Command display with scrollable text box
- Timeout progress bar (60s default)
- Three action buttons: DENY, ALLOW ONCE, ALWAYS ALLOW
- Responsive design for mobile and desktop

### 2. `/src/components/app-shell.js`
Added:
- Import for approval-dialog component
- `_pendingApproval` state property
- `_onApprovalResponse` event handler
- Event listener for `approval-response`
- Handling for `exec.approval.requested` WebSocket events
- Render logic to show approval-dialog when pending

### 3. `/src/services/ws-client.js`
Added:
- `sendApprovalResponse(approvalId, decision)` method
- Sends approval resolution to gateway via WebSocket

### 4. `/server/index.js`
Added:
- Detection of `exec.approval.requested` events
- Push notification support for background approvals
- Notification includes approvalId, command preview, agentId

### 5. `/server/push-manager.js`
Enhanced:
- Proper payload structure with actions, requireInteraction
- Support for notification options

### 6. `/public/sw.js` (Service Worker)
Enhanced:
- Handle `requireInteraction` flag for persistent notifications
- Support for approval notification actions (Approve/Deny buttons)
- Handle notification click actions from background

## How It Works

### Flow: Exec Approval in PWA

1. **Gateway sends approval request**
   ```
   Gateway → Relay: exec.approval.requested event
   ```

2. **Relay forwards to PWA clients**
   ```
   Relay → PWA (WebSocket): {event: 'exec.approval.requested', payload: {...}}
   ```

3. **PWA shows approval dialog**
   - App-shell receives event
   - Sets `_pendingApproval` state
   - Renders `<approval-dialog>` component
   - Dialog shows command, agent, timeout countdown

4. **User responds**
   - Clicks DENY, ALLOW ONCE, or ALWAYS ALLOW
   - Dialog emits `approval-response` event
   - App-shell calls `wsClient.sendApprovalResponse()`

5. **Response sent to gateway**
   ```
   PWA → Relay: exec.approval.resolve request
   Relay → Gateway: Forwarded request
   ```

### Background Approval Flow

1. If PWA is not visible when approval arrives:
   - Relay sends push notification via Web Push
   - Notification has `requireInteraction: true` (persists on screen)
   - Notification actions: Approve / Deny buttons

2. User taps notification:
   - Service worker handles click
   - Opens/focuses PWA
   - Can handle approve/deny actions directly

## Design Features

### Visual Style
- Dark gradient background (#000810 → #001520)
- Cyan neon border (#00FFFF) with glow effect
- Animated corner accents
- Scanline animation across top
- Warning icon with red pulse animation

### Typography
- Headers: Orbitron font (f-display)
- Labels: Share Tech Mono (f-mono)
- Commands: Monospace with word-break

### Interactions
- Haptic feedback on all actions
- Success/error notifications after response
- Animated timeout bar (cyan → red)
- Scale animations on button press

## Testing

To test the approval flow:

1. Build PWA: `npm run build`
2. Restart relay server
3. Open PWA on iPhone
4. Trigger exec that requires approval:
   ```
   ssh root@192.168.1.100 "ls"
   ```
5. Approval popup should appear with command details
6. Test all three buttons

## Future Enhancements

- Quick approve/deny from push notification without opening app
- History of recent approvals in Settings tab
- Allowlist management UI in Settings
- Per-command auto-allow patterns
