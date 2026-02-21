import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    // Ensure HMR works when running inside a devcontainer or Docker
    // - usePolling helps environments where file change events are not propagated
    // - HMR host/port can be overridden with HMR_HOST/HMR_PORT env vars
    hmr: {
      protocol: 'ws',
      host: process.env.HMR_HOST || 'localhost',
      port: process.env.HMR_PORT ? Number(process.env.HMR_PORT) : undefined,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    allowedHosts:[
      ".lhr.life"
    ]
  },
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(
      JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')).version || '0.0.0'
    ),
  },
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
});
