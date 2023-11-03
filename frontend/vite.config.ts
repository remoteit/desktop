import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',
    minify: process.env.NODE_ENV === 'production',
    emptyOutDir: true,
  },
  optimizeDeps: {
    // exclude: ['immer'],
  },
  plugins: [react()],
  // resolve: {
  //   alias: { '@shared': path.resolve(__dirname, '../shared') },
  // },
})
