import { build } from 'esbuild'
import { createHash } from 'crypto'
import path from 'path'
import type { Plugin } from 'vite'
import { signerDocument } from './src/signer/document'

/* Builds signer.html (src/signer: the document that makes and opens publisher key files and signs releases, in a
   sandboxed frame) apart from the app: esbuild bundles src/signer/main.ts and what it imports — its own code and the
   vendored keyfile.mjs, never a chunk the app shares — into one script, inlined under a policy that allows only its
   hash. Served by the dev server at /signer.html, and written beside index.html by a build. */
export function signerPlugin(): Plugin {
  const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('base64')
  const render = async () => {
    const result = await build({
      entryPoints: [path.resolve(__dirname, 'src/signer/main.ts')],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      minify: true,
      legalComments: 'none',
      write: false,
    })
    return signerDocument(result.outputFiles[0].text, sha256)
  }
  return {
    name: 'remoteit-signer',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/signer.html') return next()
        try {
          res.setHeader('content-type', 'text/html; charset=utf-8')
          res.end(await render())
        } catch (error) {
          next(error)
        }
      })
    },
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'signer.html', source: await render() })
    },
  }
}
