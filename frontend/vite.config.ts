import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    outDir: 'build',
    minify: mode === 'production',
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: { '@common': path.resolve(__dirname, '../common/src') },
  },
  server: {
    // Dev-only: same-origin path to the local ai-agent service, so the app's
    // CSP ('self') passes without loosening. Staging/prod set VITE_AGENT_URL
    // to the deployed agent domain instead — this proxy does not exist in builds.
    proxy: {
      '/agent': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/agent/, ''),
      },
    },
  },
  type: 'module',
}))
