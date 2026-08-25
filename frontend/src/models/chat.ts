import { createModel } from '@rematch/core'
import { RootModel } from '.'
import {
  streamChat,
  confirmTool,
  agentHealth,
  AgentAuthError,
  AgentEvent,
  AgentHealth,
  OrgSelection,
} from '../services/agent'
import {
  ChatHandoff,
  broadcastChatSignout,
  openChatPopout,
  popIn as closePopoutWithHandback,
} from '../services/chatPopout'
// Value import is deref'd only inside effects, so the store/model cycle is safe
import { store } from '../store'
import type { State } from '../store'
import i18n from '../i18n'

export type ChatToolCall = {
  id: string
  name: string
  input: Record<string, unknown>
  status: 'running' | 'done' | 'error'
  result?: string
}

export type ChatTranscriptMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; toolCalls: ChatToolCall[]; interrupted?: boolean }

export type IChatState = {
  open: boolean
  expanded: boolean
  messages: ChatTranscriptMessage[]
  conversationId: string
  turnId: string
  /** Org the agent is scoped to; null = uninitialized, user id = personal */
  orgId: string | null
  /** Conversation currently lives in the popout window (main window only) */
  poppedOut: boolean
  streaming: boolean
  pendingConfirmation: { toolUseId: string; toolName: string; input: Record<string, unknown> } | null
  error: string | null
  health: 'unknown' | AgentHealth
}

export const defaultChatState: IChatState = {
  open: false,
  expanded: false,
  messages: [],
  conversationId: '',
  turnId: '',
  orgId: null,
  poppedOut: false,
  streaming: false,
  pendingConfirmation: null,
  error: null,
  health: 'unknown',
}

/* Reduce one agent stream event into chat state. Mutates the immer draft. */
function applyAgentEvent(state: IChatState, event: AgentEvent): IChatState {
  const last = state.messages[state.messages.length - 1]
  let assistant = last?.role === 'assistant' ? last : undefined
  const ensureAssistant = () => {
    if (!assistant) {
      assistant = { role: 'assistant', text: '', toolCalls: [] }
      state.messages.push(assistant)
    }
    return assistant
  }

  switch (event.type) {
    case 'text_delta':
      ensureAssistant().text += event.text
      break
    case 'tool_call_start':
      ensureAssistant().toolCalls.push({ id: event.id, name: event.name, input: event.input, status: 'running' })
      break
    case 'tool_call_result': {
      const call = assistant?.toolCalls.find(c => c.id === event.id)
      if (call) {
        call.status = event.isError ? 'error' : 'done'
        call.result = event.result
      }
      break
    }
    case 'confirmation_required':
      state.pendingConfirmation = { toolUseId: event.id, toolName: event.name, input: event.input }
      break
    case 'done':
      state.streaming = false
      state.pendingConfirmation = null
      break
    case 'error':
      // The backend prefixes auth failures so the client knows a retry is
      // pointless until the token is refreshed (e.g. it expired mid-turn).
      if (event.message.startsWith('reauth_required')) {
        state.error = i18n.t('notices:chat.sessionExpired', {
          defaultValue: 'The agent lost its authority mid-turn — your session may have been revoked or refreshed. Try again.',
        })
        state.health = 'unauthorized'
      } else {
        state.error = event.message
      }
      state.streaming = false
      state.pendingConfirmation = null
      if (assistant) assistant.interrupted = true
      break
  }
  return state
}

/* The agent service is stateless: resend the transcript as role/content pairs each turn */

/* Single source of truth for the org the chat is scoped to (null = personal).
   Membership decides the scope, so the Current Org label and the org sent
   with each turn can never disagree; the name falls back to the membership
   record when organization.accounts hasn't loaded. */
export function resolveChatOrg(state: State): OrgSelection | null {
  const orgId = state.chat.orgId
  if (!orgId || orgId === state.user.id) return null
  const membership = state.accounts.membership.find(m => m.account.id === orgId)
  if (!membership) return null
  const name = (state.organization.accounts[orgId]?.name || membership.name || '').trim()
  return { id: orgId, name }
}

/* The handoff payload the main window and popout exchange — one definition so
   the two sides can never serialize different field sets */
export const toChatHandoff = (chat: IChatState): ChatHandoff => ({
  messages: chat.messages,
  conversationId: chat.conversationId,
  orgId: chat.orgId,
})

const authRequiredError = () =>
  i18n.t('notices:chat.authRequired', { defaultValue: 'The agent refused this session\u2019s credentials — refresh permissions to continue.' })

let abortController: AbortController | null = null

export default createModel<RootModel>()({
  state: { ...defaultChatState },
  effects: dispatch => ({
    async send(text: string, state) {
      if (state.chat.streaming || state.chat.pendingConfirmation) return
      const conversationId = state.chat.conversationId || crypto.randomUUID()
      dispatch.chat.addUserMessage(text)
      dispatch.chat.set({ conversationId, streaming: true, error: null })
      abortController = new AbortController()
      // Same resolution the Current Org label renders, so the scope shown is
      // always the scope sent — membership decides, name falls back
      const resolved = resolveChatOrg(state)
      const org = resolved ? { ...resolved, name: resolved.name || 'Organization' } : undefined
      // Coalesce text deltas: one dispatch per ~50ms window instead of one
      // per SSE chunk, so streaming doesn't re-render the app per token
      let deltaBuffer = ''
      let flushTimer: number | null = null
      const flushDeltas = () => {
        if (flushTimer !== null) window.clearTimeout(flushTimer)
        flushTimer = null
        if (deltaBuffer) {
          dispatch.chat.applyEvent({ type: 'text_delta', text: deltaBuffer })
          deltaBuffer = ''
        }
      }
      try {
        await streamChat({
          conversationId,
          text,
          org,
          signal: abortController.signal,
          onEvent: event => {
            if (event.type === 'turn') {
              dispatch.chat.set({ turnId: event.turnId })
            } else if (event.type === 'text_delta') {
              deltaBuffer += event.text
              if (flushTimer === null) flushTimer = window.setTimeout(flushDeltas, 50)
            } else {
              // Buffered text must land before the next non-text event
              flushDeltas()
              dispatch.chat.applyEvent(event)
            }
          },
        })
      } catch (error) {
        flushDeltas()
        if (error instanceof AgentAuthError) dispatch.chat.set({ error: authRequiredError(), health: 'unauthorized' })
        else if ((error as Error).name !== 'AbortError')
          dispatch.chat.applyEvent({ type: 'error', message: (error as Error).message })
      } finally {
        flushDeltas()
        abortController = null
        dispatch.chat.set({ streaming: false })
      }
    },
    /* The chat follows the app's active org (the sidebar selector) — the main
       window mirrors it here whenever it changes. The popout window never
       calls this: it keeps the org handed off with the conversation. */
    async syncOrg(_: void, state) {
      dispatch.chat.set({ orgId: state.accounts.activeId || state.user.id })
    },
    async confirm(approved: boolean, state) {
      const pending = state.chat.pendingConfirmation
      if (!pending) return
      // Clear synchronously so a double click (or an Approve chased by a
      // Deny) can't post a second, contradictory decision while in flight
      dispatch.chat.set({ pendingConfirmation: null })
      try {
        await confirmTool({
          turnId: state.chat.turnId,
          toolUseId: pending.toolUseId,
          approved,
        })
      } catch (error) {
        // Restore the card so the decision isn't lost with the error
        if (error instanceof AgentAuthError)
          dispatch.chat.set({ pendingConfirmation: pending, error: authRequiredError(), health: 'unauthorized' })
        else dispatch.chat.set({ pendingConfirmation: pending, error: (error as Error).message })
      }
    },
    async stop() {
      abortController?.abort()
      abortController = null
      dispatch.chat.set({ streaming: false, pendingConfirmation: null })
    },
    /* Move the conversation to its own window; the dock hides when the popout
       says hello. A blocked popup is surfaced instead of silently ignored. */
    async popOut() {
      if (!openChatPopout())
        dispatch.chat.set({
          error: i18n.t('notices:chat.popupBlocked', {
            defaultValue: 'Pop out was blocked — allow popups for this site and try again.',
          }),
        })
    },
    /* Hand the conversation back to the main window and close this popout.
       Reads the handoff after stop() so the final flushed text is included. */
    async popIn() {
      await dispatch.chat.stop()
      closePopoutWithHandback(toChatHandoff(store.getState().chat))
    },
    async checkHealth() {
      dispatch.chat.set({ health: await agentHealth() })
    },
    /* The chat has no sign-in of its own anymore — it rides the app session
       (permitteer docs/remoteit-ai-agent.md D2). An unauthorized chat while the
       app works means the standing grant predates this build's agent slice, so
       the fix is the grant heal: one silent re-authorize that merges it in. */
    async signIn() {
      await dispatch.auth.healGrant()
      await dispatch.chat.checkHealth()
    },
    /* App sign-out: nothing agent-specific to revoke — the session's end IS the
       chat's end. The transcript reset is dispatched by auth.signedOut alongside
       the other model resets — dispatching it here would land in the
       purge-to-reload window and re-persist the pre-signout state. */
    async signOut() {
      broadcastChatSignout()
      abortController?.abort()
      abortController = null
    },
  }),
  reducers: {
    set(state: IChatState, params: Partial<IChatState>) {
      Object.assign(state, params)
      return state
    },
    addUserMessage(state: IChatState, text: string) {
      state.messages.push({ role: 'user', text })
      return state
    },
    applyEvent(state: IChatState, event: AgentEvent) {
      return applyAgentEvent(state, event)
    },
    // Streaming state must not survive a reload — called when the panel mounts
    resetTransient(state: IChatState) {
      state.streaming = false
      state.pendingConfirmation = null
      state.error = null
      state.health = 'unknown'
      return state
    },
    /* Hand-off: replace the conversation with the other window's copy */
    adoptTranscript(state: IChatState, payload: ChatHandoff) {
      state.messages = payload.messages
      state.conversationId = payload.conversationId
      state.orgId = payload.orgId
      return state
    },
    clearConversation(state: IChatState) {
      state.messages = []
      state.conversationId = ''
      state.streaming = false
      state.pendingConfirmation = null
      state.error = null
      return state
    },
    reset() {
      return { ...defaultChatState }
    },
  },
})
