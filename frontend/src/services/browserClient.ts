import { handoff } from './browserGateway'

/* The portal's channel to this browser's one remote.it client (presence-server docs/browser-client-plan.md §5): the
   shared client at client.on.<stage>.remote.it, reached through a hidden frame of that origin, as a device's page
   reaches it. The portal is the person's own app, so its channel may reach any device they may — a terminal, not one
   device's pages. A client not yet registered is given a one-time code the first time it says so. */

export function clientOrigin(): string {
  const stage = /^app(\.[a-z]+)?\.remote\.it$/.exec(location.hostname)
  return `https://client.on${stage ? stage[1] ?? '' : '.local'}.remote.it`
}

let channel: Promise<MessagePort> | undefined

export function clientChannel(): Promise<MessagePort> {
  channel ??= new Promise<MessagePort>((resolve, reject) => {
    const origin = clientOrigin()
    const frame = document.createElement('iframe')
    frame.src = `${origin}/client.html`
    frame.style.display = 'none'
    frame.setAttribute('aria-hidden', 'true')
    let handedOff = false
    const timer = setTimeout(() => reject(new Error('the remote.it client did not answer')), 20_000)
    window.addEventListener('message', async e => {
      if (e.origin !== origin) return
      const d = e.data
      if (d?.type === 'client-ready') frame.contentWindow?.postMessage({ type: 'connect' }, origin)
      else if (d?.type === 'port') {
        clearTimeout(timer)
        resolve(d.port)
      } else if (d?.type === 'state' && d.state === 'needs-handoff' && !handedOff) {
        handedOff = true
        const h = await handoff()
        if (h) frame.contentWindow?.postMessage({ type: 'handoff', handoff: h }, origin)
      }
    })
    document.body.appendChild(frame)
  }).catch(err => {
    channel = undefined
    throw err
  })
  return channel
}

export type SSHEvents = {
  open: () => void
  data: (bytes: Uint8Array) => void
  end: () => void
  error: (message: string) => void
  ask: (instruction: string, questions: { prompt: string; echo: boolean }[]) => Promise<string[]>
  hostKey: (key: { host: string; type: string; fingerprint: string }) => Promise<boolean>
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
    }
  }
  port.postMessage({ type: 'ssh', ...target, session: ch.port2 }, [ch.port2])
  return {
    input: bytes => ch.port1.postMessage({ type: 'input', bytes }),
    resize: (cols, rows) => ch.port1.postMessage({ type: 'resize', cols, rows }),
    close: () => ch.port1.postMessage({ type: 'close' }),
  }
}
