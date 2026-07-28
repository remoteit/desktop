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
