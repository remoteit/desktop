import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv sees frontend/.env files; process.env would only see shell vars
  const env = loadEnv(mode, __dirname, '')
  return {
    build: {
      outDir: 'build',
      minify: mode === 'production',
      emptyOutDir: true,
      sourcemap: true,
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              // Keep the markdown renderer's parser tree out of the always-
              // loaded vendor chunk — it belongs to the lazy-loaded chat panel
              // (small shared utils it pulls in may still land in vendor)
              if (/[\\/]node_modules[\\/](react-markdown|remark-|rehype-|micromark|mdast-|unified|hast-|vfile|unist-)/.test(id))
                return
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
      // Dev-only: same-origin path to the ai-agent service, so the app's CSP
      // ('self') passes without loosening. Defaults to the local dev service;
      // set AGENT_PROXY_TARGET in frontend/.env to point at a deployed agent
      // (e.g. http://dev-ai-agent.remote.it — its ALB is HTTP-only for now, so
      // the same-origin proxy also sidesteps the CSP https:-only rule).
      // Staging/prod builds set VITE_AGENT_URL instead — no proxy in builds.
      proxy: {
        '/agent': {
          target: env.AGENT_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/agent/, ''),
        },
        // Dev-only: same-origin path to the Hydra OAuth front so the browser's
        // DCR + token-exchange calls avoid CORS entirely (top-level login
        // redirects go to the real domain and don't need this). Packaged builds
        // need the origin CORS-allow-listed or a main-process exchange instead.
        '/hydra': {
          target: env.VITE_HYDRA_ISSUER_URL || 'https://login.dev.remote.it',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/hydra/, ''),
        },
      },
    },
    type: 'module',
  }
})
