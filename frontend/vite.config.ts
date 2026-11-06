import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// CloudFront compresses only files of 1,000 to 10,000,000 bytes: anything bigger goes out uncompressed — the 12 MB
// vendor chunk was 4.8x its brotli size on the wire, and a transfer that long sometimes stalls at the edge, leaving the
// page on its splash with `load` never fired. A web build with such a file fails here instead of shipping it.
const CLOUDFRONT_COMPRESS_MAX = 10_000_000
function compressibleChunks(): Plugin {
  return {
    name: 'compressible-chunks',
    apply: 'build',
    generateBundle(_options, bundle) {
      const tooBig = Object.values(bundle)
        .map(file => ({
          name: file.fileName,
          bytes: Buffer.byteLength(file.type === 'chunk' ? file.code : (file.source as string | Uint8Array)),
        }))
        .filter(file => /\.(js|css)$/.test(file.name) && file.bytes > CLOUDFRONT_COMPRESS_MAX)
      if (tooBig.length)
        this.error(
          `over CloudFront's ${CLOUDFRONT_COMPRESS_MAX}-byte compression limit (split it in manualChunks): ` +
            tooBig.map(file => `${file.name} ${file.bytes}`).join(', ')
        )
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv sees frontend/.env files; process.env would only see shell vars
  const env = loadEnv(mode, __dirname, '')
  // The embedded build (scripts/build-embedded.mjs): loaded from its own files under whatever path its shell serves it
  // at (the menu's token path, Capacitor's webDir), so every URL is relative; no source maps in what a package carries.
  const embedded = (process.env.VITE_EMBEDDED || env.VITE_EMBEDDED) === 'true'
  return {
    base: embedded ? './' : undefined,
    build: {
      outDir: 'build',
      minify: mode === 'production',
      emptyOutDir: true,
      sourcemap: !embedded,
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              // Keep the markdown renderer's parser tree out of the always-
              // loaded vendor chunk — it belongs to the lazy-loaded chat panel
              // (small shared utils it pulls in may still land in vendor)
              if (
                /[\\/]node_modules[\\/](react-markdown|remark-|rehype-|micromark|mdast-|unified|hast-|vfile|unist-)/.test(
                  id
                )
              )
                return
              // Font Awesome's whole packs (components/Icon adds them all, as icon names come from data) are ~9 MB of
              // the vendor code: a chunk each keeps every file under CloudFront's 10 MB compression ceiling.
              const icons = /[\\/]node_modules[\\/]@fortawesome[\\/]([a-z-]+)-svg-icons[\\/]/.exec(id)
              if (icons) return `icons-${icons[1]}`
              return 'vendor'
            }
          },
        },
      },
    },
    plugins: [react(), compressibleChunks()],
    define: {
      // Gradle applies Firebase only when this file has content, and without Firebase the push
      // plugin's register() crashes the Android app (Capacitor rethrows the native exception)
      'import.meta.env.VITE_FIREBASE_CONFIGURED': JSON.stringify(
        !!fs.statSync(path.resolve(__dirname, '../android/app/google-services.json'), { throwIfNoEntry: false })?.size
      ),
    },
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
        // The desktop backend names the sign-in redirect (oidc.ts redirectUri) and sends no CORS headers.
        '/authRedirect': `http://127.0.0.1:${env.VITE_PORT || 29999}`,
      },
    },
    type: 'module',
  }
})
