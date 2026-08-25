// import type only: the chat model value-imports this service (signout
// broadcast), so a value import here would create a runtime cycle
import type { ChatTranscriptMessage } from '../models/chat'
// Shared with electron/src/ElectronApp.ts, which allows and sizes the window
import { CHAT_POPOUT_PARAM, CHAT_POPOUT_SIZE } from '@common/constants'

/**
 * Chat popout: the panel moves into its own window (same bundle, boot flag)
 * and the conversation hands off over a BroadcastChannel. This module owns
 * the flag, the channel, and the protocol; it never imports the store —
 * callers inject handlers (avoids store/model import cycles).
 */
const OWNER_KEY = 'chatPopoutOwner'

// Captured at module-evaluation time, before any routing can touch the URL

const bootQuery = new URLSearchParams(window.location.search)
export const isChatPopout = bootQuery.has(CHAT_POPOUT_PARAM)
// The popout's identity — the flag's value ties it to the one tab that opened
// it. Every main tab hears the shared channel, so directed messages carry
// this id and non-owner tabs ignore them.
const popoutId = bootQuery.get(CHAT_POPOUT_PARAM) || ''

// Per-tab (sessionStorage survives a reload of the owning tab, but no other
// tab has it): the id of the popout this tab opened, if any
const ownerId = (): string | null => window.sessionStorage.getItem(OWNER_KEY)

export type ChatHandoff = {
  messages: ChatTranscriptMessage[]
  conversationId: string
  orgId: string | null
}

// Every message except the broadcast 'signout' is directed: it carries the
// popout's id so only the owning tab and its popout react to each other
type PopoutMessage =
  | { type: 'hello'; id: string }
  | { type: 'adopt'; id: string; payload: ChatHandoff }
  | { type: 'handback'; id: string; payload: ChatHandoff }
  | { type: 'ping'; id: string }
  | { type: 'alive'; id: string }
  | { type: 'signout' }

export type PopoutMainHandlers = {
  getHandoff: () => ChatHandoff
  /** handback arrived: apply the transcript and reopen the dock */
  adopt: (payload: ChatHandoff) => void
  /** popout said hello: hide the dock */
  onPopoutOpened: () => void
  /** popout vanished without a handback: reopen the dock as-is */
  onPopoutLost: () => void
  /** boot reconciliation: does a popout exist right now? */
  onPresence: (present: boolean) => void
}

export type PopoutWindowHandlers = {
  adopt: (payload: ChatHandoff) => void
  getHandoff: () => ChatHandoff
  onSignout: () => void
}

const CHANNEL = 'remoteit-chat-popout'
const WINDOW_NAME = 'remoteit-chat'
const WINDOW_FEATURES = `popup=yes,width=${CHAT_POPOUT_SIZE.width},height=${CHAT_POPOUT_SIZE.height}`
const POLL_INTERVAL = 2000
const PRESENCE_TIMEOUT = 500

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null
const post = (message: PopoutMessage) => channel?.postMessage(message)

let popoutWindow: Window | null = null
let pollTimer: number | undefined
let aliveResolve: ((alive: boolean) => void) | null = null
let missedPings = 0
let suppressHandback = false

/* One liveness probe: resolves true on the popout's 'alive' reply, false
   after PRESENCE_TIMEOUT. The boot presence check and the crash-net poll
   both await this instead of threading shared timing flags. */
const pingPopout = (id: string): Promise<boolean> =>
  new Promise(resolve => {
    aliveResolve?.(false) // a superseded probe counts as unanswered
    aliveResolve = alive => {
      aliveResolve = null
      resolve(alive)
    }
    post({ type: 'ping', id })
    window.setTimeout(() => aliveResolve?.(false), PRESENCE_TIMEOUT)
  })

/* ---------- main-window side ---------- */

export function openChatPopout(): boolean {
  // Reuse the stored id so re-clicking Pop out re-targets the same named
  // window instead of orphaning it under a new identity
  const id = ownerId() || crypto.randomUUID().slice(0, 8)
  const opened = window.open(`${window.location.origin}/?${CHAT_POPOUT_PARAM}=${id}`, WINDOW_NAME, WINDOW_FEATURES)
  if (!opened) return false // popup blocked — dock stays; hello never arrives
  window.sessionStorage.setItem(OWNER_KEY, id)
  popoutWindow = opened
  return true
}

export function initChatPopoutMain(handlers: PopoutMainHandlers): () => void {
  if (!channel) return () => {}
  const listener = (event: MessageEvent<PopoutMessage>) => {
    const message = event.data
    // Only the tab that owns this popout speaks its protocol; every other
    // tab hears the channel too and must not adopt, hide its dock, or poll
    if (message.type === 'signout' || message.id !== ownerId()) return
    switch (message.type) {
      case 'hello':
        post({ type: 'adopt', id: message.id, payload: handlers.getHandoff() })
        handlers.onPopoutOpened()
        startPolling(handlers)
        break
      case 'handback':
        stopPolling()
        handlers.adopt(message.payload)
        break
      case 'alive':
        aliveResolve?.(true)
        break
    }
  }
  channel.addEventListener('message', listener)
  return () => channel.removeEventListener('message', listener)
}

/* Ask whether a popout survives from a previous page load; corrects a stale
   persisted poppedOut flag either way */
export function checkPopoutPresence(handlers: PopoutMainHandlers): void {
  const id = ownerId()
  if (!channel || !id) {
    // Not this tab's popout (or no channel) — treat as absent for this tab
    handlers.onPresence(false)
    return
  }
  pingPopout(id).then(present => {
    handlers.onPresence(present)
    if (present) startPolling(handlers)
  })
}

export function broadcastChatSignout(): void {
  post({ type: 'signout' })
  // The popout is being closed deliberately — a lagging poll must not
  // race in afterward and force `open: true` into freshly-reset state.
  stopPolling()
}

/* Crash net: a popout that dies without beforeunload still restores the
   dock. Uses the window handle when we have one (same page load), pings
   otherwise (main was reloaded while popped out). Two consecutive missed
   replies are required before declaring it lost, so one slow reply doesn't
   false-positive. */
function startPolling(handlers: PopoutMainHandlers) {
  if (pollTimer) return
  missedPings = 0
  pollTimer = window.setInterval(() => {
    if (popoutWindow) {
      if (popoutWindow.closed) lost(handlers)
      return
    }
    pingPopout(ownerId() || '').then(alive => {
      if (!pollTimer) return
      if (alive) missedPings = 0
      else if (++missedPings >= 2) lost(handlers)
    })
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = undefined
  popoutWindow = null
  missedPings = 0
}

function lost(handlers: PopoutMainHandlers) {
  stopPolling()
  handlers.onPopoutLost()
}

/* ---------- popout-window side ---------- */

export function initChatPopoutWindow(handlers: PopoutWindowHandlers): () => void {
  if (!channel) return () => {}
  const messageListener = (event: MessageEvent<PopoutMessage>) => {
    const message = event.data
    // Directed messages must come from the owning tab; sign-out is broadcast
    if (message.type !== 'signout' && message.id !== popoutId) return
    switch (message.type) {
      case 'adopt':
        // Main's copy is authoritative at hand-off; until it arrives the
        // window shows its own boot-time transcript
        handlers.adopt(message.payload)
        break
      case 'ping':
        post({ type: 'alive', id: popoutId })
        break
      case 'signout':
        suppressHandback = true // sign-out clears the transcript; nothing to hand back
        handlers.onSignout()
        break
    }
  }
  const beforeUnloadListener = () => {
    if (!suppressHandback) post({ type: 'handback', id: popoutId, payload: handlers.getHandoff() })
  }
  channel.addEventListener('message', messageListener)
  window.addEventListener('beforeunload', beforeUnloadListener)
  post({ type: 'hello', id: popoutId })
  return () => {
    channel.removeEventListener('message', messageListener)
    window.removeEventListener('beforeunload', beforeUnloadListener)
  }
}

export function popIn(payload: ChatHandoff): void {
  post({ type: 'handback', id: popoutId, payload })
  suppressHandback = true // beforeunload would duplicate it (harmless but noisy)
  window.close()
}
