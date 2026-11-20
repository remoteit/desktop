import { tarGz } from './appArchive'
import { manifestText } from './appManifest'

/* Build it yourself's starter (presence-server docs/device-apps-new-app.md, "Build it yourself"): the README's first
   app (remoteit/apps README, examples/hello) as a folder to start from, named for the publisher — a manifest, the one
   page its program serves, its release notes —, packed as a .tar.gz in the browser. Nothing in the program knows
   remote.it: the manifest says how it runs. */

export const starterManifest = (publisher: string) => ({
  contract: 1,
  app: `${publisher}.hello`,
  version: '1.0.0',
  name: 'Hello',
  description: 'One web page with a title its owner sets.',
  run: { command: 'hello.py', args: ['${remoteit.port}', '${setting.title}'] },
  listen: { type: 'tcp' },
  service: { name: 'Hello', protocol: 'http' },
  health: { type: 'http', path: '/' },
  settings: { title: { type: 'string', label: 'Title', default: 'Hello from remote.it', max_length: 80 } },
})

const HELLO = `#!/usr/bin/env python3
# Serves one page on 127.0.0.1:<port> with the owner's title. Nothing in it knows remote.it.
import html
import http.server
import sys

port, title = int(sys.argv[1]), sys.argv[2]


class Page(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = f"<!doctype html><title>{html.escape(title)}</title><h1>{html.escape(title)}</h1>\\n".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


http.server.HTTPServer(("127.0.0.1", port), Page).serve_forever()
`

export async function starterArchive(publisher: string): Promise<Uint8Array> {
  const enc = (text: string) => new TextEncoder().encode(text)
  return tarGz([
    { name: 'hello/' },
    { name: 'hello/manifest.json', data: enc(manifestText(starterManifest(publisher))) },
    { name: 'hello/hello.py', data: enc(HELLO), exec: true },
    { name: 'hello/NOTES.md', data: enc('First release.\n') },
  ])
}
