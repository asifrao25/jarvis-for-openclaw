#!/bin/bash
set -e

echo "=== OpenClaw PWA Setup ==="

cd /Users/m4-mac/openclaw-pwa

# Ensure logs directory exists
mkdir -p ~/.openclaw/logs

# Build PWA
echo "Building PWA..."
npx vite build

# Copy service worker and manifest to dist (they're in public/)
cp public/manifest.json dist/
cp -r public/icons dist/ 2>/dev/null || true

# Copy service worker from src (it needs to be at the root of /pwa/)
cp src/sw.js dist/

# Install LaunchAgent
echo "Installing LaunchAgent..."
cp deploy/com.openclaw-pwa.relay.plist ~/Library/LaunchAgents/

# Load LaunchAgent
echo "Loading LaunchAgent..."
launchctl unload ~/Library/LaunchAgents/com.openclaw-pwa.relay.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.openclaw-pwa.relay.plist

# Configure Tailscale Serve
echo "Configuring Tailscale Serve..."
tailscale serve --bg --https=443 /pwa http://127.0.0.1:18800

echo ""
echo "=== Setup Complete ==="
echo "Relay server running on port 18800"
echo "PWA available at: https://your-machine.tailnet.ts.net/pwa/"
echo ""
echo "Logs:"
echo "  stdout: ~/.openclaw/logs/pwa-relay.log"
echo "  stderr: ~/.openclaw/logs/pwa-relay.err.log"
echo ""
echo "Next steps:"
echo "  1. Open https://your-machine.tailnet.ts.net/pwa/ on your iPhone"
echo "  2. Tap Share → Add to Home Screen"
echo "  3. Open the PWA and login"
echo "  4. Enable notifications when prompted"
