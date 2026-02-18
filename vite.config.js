import { defineConfig } from 'vite';

// Vite doesn't add error handlers to raw TCP sockets, so ECONNRESET
// (mobile client closing connection abruptly) crashes the process.
// This plugin silently swallows those errors.
const suppressSocketErrors = {
  name: 'suppress-socket-errors',
  configureServer(server) {
    server.httpServer?.on('connection', (socket) => {
      socket.on('error', (err) => {
        if (err.code !== 'ECONNRESET') throw err;
      });
    });
  },
};

export default defineConfig({
  root: 'src',
  base: '/pwa/',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 18801,
  },
  plugins: [suppressSocketErrors],
});
