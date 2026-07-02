import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Railway serves the app at the domain root (not the old GitHub Pages subpath).
  base: '/',
  server: {
    port: 3000,
    // Bind all interfaces (IPv4 127.0.0.1 + IPv6) so `localhost` always connects.
    host: true,
    open: true,
    // In dev the frontend (Vite, 3000) proxies API calls to the Express server (3001).
    // In production one Railway service serves both, so no proxy is needed.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['lodash', 'xlsx', 'papaparse'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
