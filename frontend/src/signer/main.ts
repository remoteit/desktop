import { createKey, describeManifest, KeyFileError, NotStanding, signRelease } from './core'
import { CreateLabels, FromSigner, SignLabels, ToSigner } from './protocol'

/* The signer's page (signer.html, built by signerPlugin into one inline script under a policy that refuses every
   connection; presence-server docs/device-apps-new-app.md, "The signer"). It runs in a sandboxed frame at an opaque
   origin, so the portal's scripts cannot reach its inputs, and it answers only a parent of its own URL's origin: a
   request from any other is ignored, and every answer is addressed to that origin alone, so a page elsewhere that
   frames it learns nothing. It builds its own small form for each request; the key file's text, the passphrase and
   the key are dropped as soon as they are used. */

const own = new URL(location.href).origin
const root = document.getElementById('signer')!

const send = (message: FromSigner) => window.parent.postMessage(message, own)

function el<T extends HTMLElement = HTMLElement>(
  tag: string,
  props: Record<string, unknown> = {},
  ...children: (Node | string)[]
): T {
  const node = Object.assign(document.createElement(tag), props) as T
  node.append(...children)
  return node
}

const field = (label: string, input: HTMLInputElement) =>
  el('label', { className: 'field' }, el('span', {}, label), input)
const say = (node: HTMLElement, text: string, error = false) => {
  node.textContent = text
  node.className = error ? 'note error' : 'note'
}

function create(publisher: string, labels: CreateLabels) {
  const passphrase = el<HTMLInputElement>('input', { type: 'password', autocomplete: 'new-password' })
  const again = el<HTMLInputElement>('input', { type: 'password', autocomplete: 'new-password' })
  const button = el<HTMLButtonElement>('button', { type: 'button', textContent: labels.create, className: 'primary' })
  const note = el('p', { className: 'note' })
  root.replaceChildren(
    el('p', {}, labels.intro),
    field(labels.passphrase, passphrase),
    field(labels.again, again),
    button,
    note
  )
  passphrase.focus()
  button.onclick = async () => {
    if ([...passphrase.value].length < 12) return say(note, labels.short, true)
    if (passphrase.value !== again.value) return say(note, labels.mismatch, true)
    button.disabled = true
    say(note, labels.creating)
    let made: Awaited<ReturnType<typeof createKey>> | undefined
    try {
      made = await createKey(publisher, passphrase.value)
    } catch (error) {
      button.disabled = false
      return say(note, error instanceof KeyFileError ? error.message : labels.failed, true)
    } finally {
      passphrase.value = again.value = ''
    }
    // The download is its own click: a browser lets a frame save a file only on a person's gesture.
    const { file, fileName, publicKey, keyId } = made
    made = undefined
    const download = el<HTMLButtonElement>('button', {
      type: 'button',
      textContent: labels.download,
      className: 'primary',
    })
    root.replaceChildren(el('p', {}, `${labels.keyId} ${keyId}`), download, note)
    say(note, '')
    download.onclick = () => {
      const url = URL.createObjectURL(new Blob([file], { type: 'application/x-pem-file' }))
      el<HTMLAnchorElement>('a', { href: url, download: fileName }).click()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      download.disabled = true
      say(note, labels.downloaded)
      send({ type: 'created', publicKey, keyId })
    }
  }
}

async function sign(manifest: Uint8Array, keys: Extract<ToSigner, { type: 'sign' }>['keys'], labels: SignLabels) {
  const what = await describeManifest(manifest)
  const keyFile = el<HTMLInputElement>('input', { type: 'file', accept: '.pem,.key,text/plain' })
  const passphrase = el<HTMLInputElement>('input', { type: 'password', autocomplete: 'off' })
  const button = el<HTMLButtonElement>('button', { type: 'button', textContent: labels.sign, className: 'primary' })
  const note = el('p', { className: 'note' })
  const row = (label: string, value: string, strong = false) =>
    el('div', { className: 'row' }, el('span', {}, label), el(strong ? 'strong' : 'code', {}, value))
  root.replaceChildren(
    el(
      'div',
      { className: 'what' },
      row(labels.app, what.app),
      row(labels.version, what.version),
      row(labels.runs, what.root ? labels.root : labels.restricted, what.root),
      row(labels.platforms, what.platforms.join(', ') || '—'),
      row(labels.sha256, what.sha256)
    ),
    el('p', {}, labels.intro),
    field(labels.keyFile, keyFile),
    field(labels.passphrase, passphrase),
    button,
    note
  )
  button.onclick = async () => {
    const chosen = keyFile.files?.[0]
    if (!chosen) return say(note, labels.keyFile, true)
    button.disabled = true
    say(note, labels.signing)
    try {
      const signed = await signRelease(await chosen.text(), passphrase.value, manifest, keys)
      send({ type: 'signed', ...signed })
      root.replaceChildren(note)
    } catch (error) {
      button.disabled = false
      say(note, problem(error, labels), true)
    } finally {
      passphrase.value = ''
      keyFile.value = ''
    }
  }
}

// A key file's problem in the person's words where there are some; the reader's own words (a file of another kind,
// a cipher it does not take) otherwise.
function problem(error: unknown, labels: SignLabels) {
  if (error instanceof NotStanding) return labels.notStanding
  if (!(error instanceof KeyFileError)) return labels.failed
  return /wrong passphrase/.test(error.message) ? labels.wrongPassphrase : error.message
}

window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== own) return
  const message = event.data as ToSigner
  if (message?.type === 'create') create(String(message.publisher), message.labels)
  else if (message?.type === 'sign' && message.manifest instanceof Uint8Array)
    sign(message.manifest, message.keys, message.labels)
})

new ResizeObserver(() => send({ type: 'height', px: document.documentElement.scrollHeight })).observe(document.body)
send({ type: 'ready' })
