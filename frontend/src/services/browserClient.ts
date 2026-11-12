import { handoff } from './browserGateway'
import { graphQLDecommissionDevices, graphQLDisableDevices } from './deviceDisable'

/* The portal's channel to this browser's one remote.it client (presence-server docs/browser-client-plan.md §5): the
   shared client at client.on.<stage>.remote.it, reached through a hidden frame of that origin, as a device's page
   reaches it. The portal is the person's own app, so its channel may reach any device they may — a terminal, not one
   device's pages. A client not yet registered is given a one-time code the first time it says so. */

export function clientOrigin(): string {
  const stage = /^app(\.[a-z]+)?\.remote\.it$/.exec(location.hostname)
  return `https://client.on${stage ? stage[1] ?? '' : '.local'}.remote.it`
}

let channel: Promise<MessagePort> | undefined
let frame: HTMLIFrameElement | undefined
// Signing out: a client forgotten then is not handed a code — the next person to sign in here registers their own.
let handoffsStopped = false
// That this browser has run a client for the portal, kept on the portal's own origin: sign-out forgets one only where one
// may be (the client's storage is client.on's, which the portal cannot read).
const USED_KEY = 'remoteit-browser-client'

// The frame lives as long as the page. It loads again by itself when a newer client is published (connectd
// web/client-worker.js newerPublished: the old client tells its frames to reload, and ends), and says client-ready
// again: connected anew, its new port is the channel from then on. A client that asks for a handoff — the first time,
// or again after its device was deleted — is given a new one-time code each time it asks, one at a time.
export function clientChannel(): Promise<MessagePort> {
  channel ??= new Promise<MessagePort>((resolve, reject) => {
    try {
      localStorage.setItem(USED_KEY, '1')
    } catch {}
    const origin = clientOrigin()
    frame = document.createElement('iframe')
    const own = frame
    frame.src = `${origin}/client.html`
    frame.style.display = 'none'
    frame.setAttribute('aria-hidden', 'true')
    let resolved = false
    let handingOff = false
    const timer = setTimeout(() => reject(new Error('the remote.it client did not answer')), 20_000)
    window.addEventListener('message', async e => {
      if (e.origin !== origin || e.source !== own.contentWindow) return
      const d = e.data
      if (d?.type === 'client-ready') own.contentWindow?.postMessage({ type: 'connect' }, origin)
      else if (d?.type === 'port') {
        clearTimeout(timer)
        if (resolved) channel = Promise.resolve(d.port)
        resolved = true
        resolve(d.port)
      } else if (d?.type === 'state' && d.state === 'needs-handoff' && !handingOff && !handoffsStopped) {
        handingOff = true
        try {
          const h = await handoff()
          if (h) own.contentWindow?.postMessage({ type: 'handoff', handoff: h }, origin)
        } finally {
          handingOff = false
        }
      }
    })
    document.body.appendChild(own)
  }).catch(err => {
    channel = undefined
    throw err
  })
  return channel
}

// Makes this browser's client forget itself (connectd web/client-worker.js forget): its key, its UID, the host keys it
// accepted. Resolves to the UID it was — null for none, or no answer in time.
export async function forgetBrowserClient(waitMs = 10_000): Promise<string | null> {
  const port = await clientChannel()
  const id = Math.random()
  return new Promise(resolve => {
    const timer = setTimeout(() => done(null), waitMs)
    const heard = (m: MessageEvent) => {
      if (m.data?.type === 'forgotten' && m.data.id === id) done(typeof m.data.uid === 'string' ? m.data.uid : null)
    }
    const done = (uid: string | null) => {
      clearTimeout(timer)
      port.removeEventListener('message', heard)
      resolve(uid)
    }
    port.addEventListener('message', heard)
    port.start()
    port.postMessage({ type: 'forget', id })
  })
}

// Whether this browser has run a client for the portal.
export function browserClientUsed(): boolean {
  try {
    return localStorage.getItem(USED_KEY) === '1'
  } catch {
    return false
  }
}

// The person's reset of this browser's client — one that does not work — or their sign-out: the client forgets itself,
// and its device is removed as the person (disabled, then decommissioned; a device not theirs any more is refused, and
// left to its own expiry). After a reset the client registers anew the next time it is used. Signing out, it is not
// handed a code, and the frame goes: nothing of the client stays in the browser for whoever signs in next.
export async function resetBrowserClient(options: { signingOut?: boolean } = {}): Promise<void> {
  if (options.signingOut) handoffsStopped = true
  const uid = await forgetBrowserClient()
  if (uid && (await graphQLDisableDevices([uid])) !== 'ERROR') await graphQLDecommissionDevices([uid])
  if (!options.signingOut) return
  try {
    localStorage.removeItem(USED_KEY)
  } catch {}
  // The frame gone, nothing of it can ask for a code: the next person to sign in here starts a client of their own.
  frame?.remove()
  frame = undefined
  channel = undefined
  handoffsStopped = false
}

export type SSHEvents = {
  open: () => void
  data: (bytes: Uint8Array) => void
  end: () => void
  error: (message: string) => void
  ask: (instruction: string, questions: { prompt: string; echo: boolean }[]) => Promise<string[]>
  hostKey: (key: { host: string; type: string; fingerprint: string }) => Promise<boolean>
  // A certificate for the session's key (graphql sshCertificate), or null: the password is asked instead.
  certificate?: (publicKey: string) => Promise<string | null>
}

export type SSHSession = {
  input: (bytes: Uint8Array) => void
  resize: (cols: number, rows: number) => void
  close: () => void
}

// An SSH session through the client: the protocol in it, this page drawing the terminal.
export async function openSSH(
  target: { name: string; port: number; user: string; cols: number; rows: number },
  on: SSHEvents
): Promise<SSHSession> {
  const port = await clientChannel()
  const ch = new MessageChannel()
  ch.port1.onmessage = async m => {
    const d = m.data
    if (d?.type === 'open') on.open()
    else if (d?.type === 'data') on.data(new Uint8Array(d.bytes.buffer ?? d.bytes))
    else if (d?.type === 'end') on.end()
    else if (d?.type === 'error') on.error(d.message)
    else if (d?.type === 'ask') {
      const value = await on.ask(d.payload.instruction, d.payload.questions)
      ch.port1.postMessage({ type: 'answer', id: d.id, value })
    } else if (d?.type === 'hostKey') {
      const value = await on.hostKey(d.payload)
      ch.port1.postMessage({ type: 'answer', id: d.id, value })
    } else if (d?.type === 'certificate') {
      const value = on.certificate ? await on.certificate(d.payload.publicKey).catch(() => null) : null
      ch.port1.postMessage({ type: 'answer', id: d.id, value })
    }
  }
  port.postMessage({ type: 'ssh', ...target, session: ch.port2 }, [ch.port2])
  return {
    input: bytes => ch.port1.postMessage({ type: 'input', bytes }),
    resize: (cols, rows) => ch.port1.postMessage({ type: 'resize', cols, rows }),
    close: () => ch.port1.postMessage({ type: 'close' }),
  }
}
