import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',
    minify: process.env.NODE_ENV === 'production',
    emptyOutDir: true,
    sourcemap: true,
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
})
