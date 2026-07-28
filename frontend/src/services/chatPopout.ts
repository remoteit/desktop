// import type only: the chat model value-imports this service (signout
// broadcast), so a value import here would create a runtime cycle
import type { ChatTranscriptMessage } from '../models/chat'

/**
 * Chat popout: the panel moves into its own window (same bundle, boot flag)
 * and the conversation hands off over a BroadcastChannel. This module owns
 * the flag, the channel, and the protocol; it never imports the store —
 * callers inject handlers (avoids store/model import cycles).
 */
export const CHAT_POPOUT_FLAG = 'chatPopout'

// Captured at module-evaluation time, before any routing can touch the URL
// (same pattern as the hydra ?code capture in services/hydra.ts)
export const isChatPopout = new URLSearchParams(window.location.search).has(CHAT_POPOUT_FLAG)

export type ChatHandoff = {
  messages: ChatTranscriptMessage[]
  conversationId: string
  orgId: string | null
}

type PopoutMessage =
  | { type: 'hello' }
  | { type: 'adopt'; payload: ChatHandoff }
  | { type: 'handback'; payload: ChatHandoff }
  | { type: 'ping' }
  | { type: 'alive' }
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
const WINDOW_FEATURES = 'popup=yes,width=520,height=780'
const POLL_INTERVAL = 2000
const PRESENCE_TIMEOUT = 500

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null
const post = (message: PopoutMessage) => channel?.postMessage(message)

let popoutWindow: Window | null = null
let pollTimer: number | undefined
let alivePending = false
let missedPings = 0
let suppressHandback = false

/* ---------- main-window side ---------- */

export function openChatPopout(): boolean {
  const opened = window.open(`${window.location.origin}/?${CHAT_POPOUT_FLAG}`, WINDOW_NAME, WINDOW_FEATURES)
  if (!opened) return false // popup blocked — dock stays; hello never arrives
  popoutWindow = opened
  return true
}

export function initChatPopoutMain(handlers: PopoutMainHandlers): () => void {
  if (!channel) return () => {}
  const listener = (event: MessageEvent<PopoutMessage>) => {
    switch (event.data.type) {
      case 'hello':
        post({ type: 'adopt', payload: handlers.getHandoff() })
        handlers.onPopoutOpened()
        startPolling(handlers)
        break
      case 'handback':
        stopPolling()
        handlers.adopt(event.data.payload)
        break
      case 'alive':
        alivePending = false
        missedPings = 0
        break
    }
  }
  channel.addEventListener('message', listener)
  return () => channel.removeEventListener('message', listener)
}

/* Ask whether a popout survives from a previous page load; corrects a stale
   persisted poppedOut flag either way */
export function checkPopoutPresence(handlers: PopoutMainHandlers): void {
  if (!channel) {
    handlers.onPresence(false)
    return
  }
  alivePending = true
  post({ type: 'ping' })
  window.setTimeout(() => {
    if (alivePending) {
      handlers.onPresence(false)
    } else {
      handlers.onPresence(true)
      startPolling(handlers)
    }
  }, PRESENCE_TIMEOUT)
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
    alivePending = true
    post({ type: 'ping' })
    window.setTimeout(() => {
      if (alivePending && pollTimer) {
        missedPings += 1
        if (missedPings >= 2) lost(handlers)
      }
    }, PRESENCE_TIMEOUT)
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
    switch (event.data.type) {
      case 'adopt':
        // Main's copy is authoritative at hand-off; until it arrives the
        // window shows its own rehydrated (persisted) transcript
        handlers.adopt(event.data.payload)
        break
      case 'ping':
        post({ type: 'alive' })
        break
      case 'signout':
        suppressHandback = true // sign-out clears the transcript; nothing to hand back
        handlers.onSignout()
        break
    }
  }
  const beforeUnloadListener = () => {
    if (!suppressHandback) post({ type: 'handback', payload: handlers.getHandoff() })
  }
  channel.addEventListener('message', messageListener)
  window.addEventListener('beforeunload', beforeUnloadListener)
  post({ type: 'hello' })
  return () => {
    channel.removeEventListener('message', messageListener)
    window.removeEventListener('beforeunload', beforeUnloadListener)
  }
}

export function popIn(payload: ChatHandoff): void {
  post({ type: 'handback', payload })
  suppressHandback = true // beforeunload would duplicate it (harmless but noisy)
  window.close()
}
