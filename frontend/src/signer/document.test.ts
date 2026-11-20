// @vitest-environment node
import { createHash } from 'crypto'
import { readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'
import { build } from 'esbuild'
import { describe, expect, it } from 'vitest'
import { signerDocument, SIGNER_STYLE } from './document'

/* signer.html as the build makes it (signerPlugin): one script and one style, each allowed by its hash alone, every
   connection refused; the script the signer's own code and the vendored key file code, nothing of the app's. And no
   module of the app but the signer imports the key file code, so the app's own bundle never holds a key. */

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('base64')

describe('signer.html', () => {
  it('is its own code under a policy that allows only it and refuses every connection', async () => {
    const result = await build({
      entryPoints: [path.resolve(__dirname, 'main.ts')],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      minify: true,
      legalComments: 'none',
      write: false,
    })
    const script = result.outputFiles[0].text
    const html = signerDocument(script, sha256)
    const policy = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)![1]
    const directives = Object.fromEntries(
      policy.split('; ').map(d => [d.split(' ')[0], d.split(' ').slice(1).join(' ')])
    )
    expect(directives).toMatchObject({
      'default-src': "'none'",
      'connect-src': "'none'",
      'form-action': "'none'",
      'frame-src': "'none'",
      'worker-src': "'none'",
      'script-src': `'sha256-${sha256(script)}'`,
      'style-src': `'sha256-${sha256(SIGNER_STYLE)}'`,
    })
    expect(html.match(/<script/g)).toHaveLength(1)
    expect(html).toContain(`<script>${script}</script>`)
    // Nothing that opens a connection, and nothing of the app's (React, i18n, analytics).
    for (const word of [
      'fetch(',
      'XMLHttpRequest',
      'WebSocket',
      'sendBeacon',
      'EventSource',
      'react',
      'i18next',
      'googletagmanager',
    ])
      expect(script).not.toContain(word)
    expect(script.length).toBeLessThan(40_000)
  })

  it('refuses a script that could close its element', () => {
    expect(() => signerDocument('"</script>"', sha256)).toThrow(/cannot be inlined/)
  })

  it('is the only part of the app that imports the key file code', () => {
    const src = path.resolve(__dirname, '..')
    const importers: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const file = path.join(dir, name)
        if (statSync(file).isDirectory()) walk(file)
        else if (
          /\.(ts|tsx)$/.test(name) &&
          !/\.test\.tsx?$/.test(name) &&
          /keyfile\.mjs/.test(readFileSync(file, 'utf8'))
        )
          importers.push(path.relative(src, file))
      }
    }
    walk(src)
    expect(importers.sort()).toEqual(['signer/core.ts', 'signer/protocol.ts'])
  })
})
