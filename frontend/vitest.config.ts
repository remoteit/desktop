import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Frontend unit tests (the app is Vite, so tests run under vitest, not the electron jest
// suite). Kept separate from vite.config.ts so the build config is untouched; the one alias
// the source relies on is mirrored here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@common': path.resolve(__dirname, '../common/src') },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
