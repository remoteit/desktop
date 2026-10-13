import ReconnectingWebSocket from 'reconnecting-websocket'
import { getWebSocketURL, getTestHeader } from '../helpers/apiHelper'
import { version } from '../helpers/versionHelper'
import { agent } from './browser'
import { wsAuthorization } from './cloudController'
import type { OutputChunk } from './jobRuns'

/* A run's live output and its job's changes, while the portal shows the run (device-package docs/scripting-plan.md, "As
   built (phase 4)"): a socket of its own beside the app's events socket, subscribed only for JOB_OUTPUT — graphql's opt-in
   type, which no other socket receives — and the job's JOB and DEVICE_JOB events, for that run and that job alone (the
   subscribe's `types` and `uris`). The app's socket is untouched: an API without these answers nothing to it, and an
   older portal never asks. Opened when a page watches a run, closed when none does. */

export type JobWatch = {
  jobId: string
  jobDeviceId: string
  onOutput: (chunks: OutputChunk[], skipped: number) => void
  onJob: () => void
}

const jobDeviceUri = (id: string) => `remoteit://job-device/${id.toUpperCase()}`
const jobUri = (id: string) => `remoteit://job/${id.toUpperCase()}`

const QUERY = `{ event { type action ... on JobOutputEvent { jobId jobDeviceId skipped chunks { seq stream text } } } }`

let socket: ReconnectingWebSocket | undefined
let watch: JobWatch | undefined
let ping: ReturnType<typeof setInterval> | undefined

async function subscribe() {
  const current = socket
  const w = watch
  if (!current || !w) return
  const message = JSON.stringify({
    action: 'subscribe',
    types: ['JOB_OUTPUT', 'JOB', 'DEVICE_JOB'],
    uris: [jobDeviceUri(w.jobDeviceId), jobUri(w.jobId)],
    headers: { authorization: await wsAuthorization(), 'User-Agent': `remoteit/${version} ${agent()}`, ...getTestHeader() },
    query: QUERY,
  })
  if (current === socket && w === watch && current.readyState === WebSocket.OPEN) current.send(message)
}

// What a frame says, for the run watched: its output, or that its job changed.
export function handleFrame(data: string, w: JobWatch | undefined = watch) {
  if (!w || data === 'OK' || data.startsWith('pong')) return
  let parsed: any
  try {
    parsed = JSON.parse(data)
  } catch {
    return
  }
  for (const payload of Array.isArray(parsed?.events) ? parsed.events : [parsed]) {
    const event = payload?.data?.event
    if (!event) continue
    if (event.type === 'JOB_OUTPUT') {
      if (String(event.jobDeviceId).toLowerCase() === w.jobDeviceId.toLowerCase())
        w.onOutput(event.chunks || [], Number(event.skipped) || 0)
    } else if (event.type === 'JOB' || event.type === 'DEVICE_JOB') w.onJob()
  }
}

// Watch one run; the returned function stops. Watching another replaces it on the same socket.
export function watchJobRun(next: JobWatch): () => void {
  watch = next
  const url = getWebSocketURL()
  if (!url) return () => {}
  if (!socket) {
    socket = new ReconnectingWebSocket(url, [], {})
    socket.addEventListener('open', () => void subscribe())
    socket.addEventListener('message', event => handleFrame(String(event.data)))
    ping = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send('ping'), 4 * 60 * 1000)
  } else void subscribe()
  return () => {
    if (watch !== next) return
    watch = undefined
    if (ping) clearInterval(ping)
    ping = undefined
    socket?.close()
    socket = undefined
  }
}
