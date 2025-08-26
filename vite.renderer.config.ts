import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      external: ['ssh2', 'crypto', 'fs', 'path', 'stream', 'child_process']
    }
  },
  server: {
    port: 5173,
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['ssh2']
  }
});
