import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use the GitHub Pages subpath only for production builds; serve at root in dev.
  base: command === 'build' ? '/dallas-living-design-dashboard/' : '/',
  server: {
    port: 3000,
    // Bind all interfaces (IPv4 127.0.0.1 + IPv6) so `localhost` always connects.
    host: true,
    open: true
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
}))
