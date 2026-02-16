import { defineConfig } from 'vite';

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
});
