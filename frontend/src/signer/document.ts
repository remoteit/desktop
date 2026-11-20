/* signer.html as built (signerPlugin, frontend/signerPlugin.ts): one inline script — the signer's whole code, bundled
   with nothing else — and one inline style, each allowed by its hash and nothing else, under a policy that refuses
   every connection, image, font, frame, worker and form. So the one document that holds a publisher's key can run only
   its own code and can send nothing anywhere: the key and the passphrase have no way out but the download the person
   asks for. Where the portal is served from CloudFront, a header says the same and adds frame-ancestors (r3-infra
   stage/portal.tf). */

export const SIGNER_STYLE = `
:root { color-scheme: light dark; font: 14px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
body { margin: 0; padding: 4px 2px 8px; }
p { margin: 0 0 12px; }
.field { display: block; margin: 0 0 12px; }
.field span { display: block; font-size: 12px; opacity: .75; margin-bottom: 4px; }
input[type=password] { box-sizing: border-box; width: 100%; padding: 8px; font: inherit; border: 1px solid #8888; border-radius: 4px; }
button { font: inherit; font-weight: 500; padding: 8px 16px; border: 0; border-radius: 4px; cursor: pointer; }
button.primary { background: #0096e7; color: #fff; }
button:disabled { opacity: .5; cursor: default; }
.note { margin-top: 12px; font-size: 13px; }
.note.error { color: #e53935; }
.what { border: 1px solid #8884; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; }
.row { display: flex; gap: 12px; font-size: 13px; }
.row span { min-width: 96px; opacity: .75; }
.row code { word-break: break-all; }
`

export const signerPolicy = (scriptHash: string, styleHash: string) =>
  [
    "default-src 'none'",
    `script-src 'sha256-${scriptHash}'`,
    `style-src 'sha256-${styleHash}'`,
    "connect-src 'none'",
    "img-src 'none'",
    "font-src 'none'",
    "media-src 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
  ].join('; ')

// The document, given its script and a SHA-256 (base64) of a text. Throws where the script could end its element.
export function signerDocument(script: string, sha256: (text: string) => string, style = SIGNER_STYLE): string {
  if (/<\/script|<!--/i.test(script))
    throw new Error('the signer script holds </script or <!--: it cannot be inlined as it is')
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${signerPolicy(sha256(script), sha256(style))}">
<meta name="referrer" content="no-referrer">
<title>remote.it signer</title>
<style>${style}</style>
</head>
<body>
<div id="signer"></div>
<script>${script}</script>
</body>
</html>
`
}
