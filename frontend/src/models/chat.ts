import { createModel } from '@rematch/core'
import { RootModel } from '.'
import {
  streamChat,
  confirmTool,
  backgroundDisable,
  fetchConversation,
  listConversations,
  deleteConversation,
  fetchUsage,
  UsageLimitError,
  type ConversationSummary,
  type Usage,
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
import { CHAT_PANEL_WIDTH } from '../constants'
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
  /** Maximized over the content area (the left nav stays); toggled by the header expand button */
  /** Docked column width in px — drag-resized, persisted */
  width: number
  messages: ChatTranscriptMessage[]
  conversationId: string
  turnId: string
  title: string
  conversations: ConversationSummary[]
  usage: Usage | null
  /** The signed-in user id this chat belongs to — reset the chat when it changes. */
  ownerId: string
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
  open: true,
  width: CHAT_PANEL_WIDTH,
  messages: [],
  conversationId: '',
  turnId: '',
  title: '',
  conversations: [],
  usage: null,
  ownerId: '',
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
          defaultValue:
            'The agent lost its authority mid-turn — your session may have been revoked or refreshed. Try again.',
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
  title: chat.title,
  orgId: chat.orgId,
})

const authRequiredError = () =>
  i18n.t('notices:chat.authRequired', {
    defaultValue: 'The agent refused this session\u2019s credentials — refresh permissions to continue.',
  })

/* A short, human reset time: a time-of-day within a day, else weekday + time. */
export const formatReset = (iso: string | null): string => {
  if (!iso) return ''
  const at = new Date(iso)
  const soon = at.getTime() - Date.now() < 24 * 60 * 60 * 1000
  return soon
    ? at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : at.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
}

const usageLimitMessage = (e: UsageLimitError): string => {
  const when = formatReset(e.resetsAt)
  return when
    ? i18n.t('notices:chat.usageReset', { defaultValue: '{{msg}} Resets {{when}}.', msg: e.message, when })
    : e.message
}

let abortController: AbortController | null = null

export default createModel<RootModel>()({
  state: { ...defaultChatState },
  effects: dispatch => ({
    async send(text: string, state) {
      if (state.chat.streaming || state.chat.pendingConfirmation) return
      const conversationId = state.chat.conversationId || crypto.randomUUID()
      dispatch.chat.addUserMessage(text)
      dispatch.chat.set({
        conversationId,
        streaming: true,
        error: null,
        // Name a fresh session by its first message immediately; the server sets the same
        // title, and loadConversations reconciles after the turn.
        ...(state.chat.title ? {} : { title: text.replace(/\s+/g, ' ').trim().slice(0, 80) }),
      })
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
        else if (error instanceof UsageLimitError)
          dispatch.chat.applyEvent({ type: 'error', message: usageLimitMessage(error) })
        else if ((error as Error).name !== 'AbortError')
          dispatch.chat.applyEvent({ type: 'error', message: (error as Error).message })
      } finally {
        flushDeltas()
        abortController = null
        dispatch.chat.set({ streaming: false })
        // A finished turn may have created (and titled) a new conversation — refresh the
        // picker; and the spend just moved, so refresh the usage meter too.
        dispatch.chat.loadConversations()
        dispatch.chat.loadUsage()
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
    async checkHealth(_: void, state) {
      /* Connectivity is the app's to detect and report — services/Network owns the
         online/offline events and raises the global notice. The same guard get.ts and
         post.ts use: probing while the app knows it is offline would relabel a network
         outage as an agent outage, and the panel would say so on top of the global
         message. Network's `connect` event re-runs this (see useChatSync). */
      if (state.ui.offline) return
      dispatch.chat.set({ health: await agentHealth() })
    },
    /* The server owns the transcript now (D11) — adopt its copy when it knows more than
       we do, which is exactly how a background turn's result appears after a reopen. */
    async syncTranscript(_: void, state) {
      const id = state.chat.conversationId
      if (!id || state.chat.streaming) return
      try {
        const remote = await fetchConversation(id)
        if (remote && remote.messages.length > state.chat.messages.length) {
          dispatch.chat.set({
            messages: remote.messages.map(m =>
              m.role === 'assistant'
                ? { role: 'assistant' as const, text: m.content, toolCalls: [] }
                : { role: 'user' as const, text: m.content }
            ),
          })
        }
      } catch {
        /* offline or deleted — the local display cache stands */
      }
    },
    /* The chat has no sign-in of its own anymore — it rides the app session
       (permitteer docs/remoteit-ai-agent.md D2). An unauthorized chat while the
       app works means the standing grant predates this build's agent slice, so
       the fix is the grant heal: one silent re-authorize that merges it in. */
    async signIn() {
      await dispatch.auth.healGrant()
      await dispatch.chat.checkHealth()
    },
    /* The history picker's list — refreshed on mount, after a turn, and after a delete. */
    /* Reset the chat when the signed-in IDENTITY changes (not an org switch — that keeps
       your account). The conversations, transcript, and usage all belong to the permitteer
       subject the agent scopes by; a persisted chat from a previous account must not carry
       over (posting to it 404s, and its history isn't yours). Same identity → no-op. */
    async syncIdentity(userId: string, state) {
      if (!userId || state.chat.ownerId === userId) return
      dispatch.chat.clearConversation()
      dispatch.chat.set({ ownerId: userId, conversations: [], usage: null })
      dispatch.chat.loadConversations()
      dispatch.chat.loadUsage()
    },
    /* The usage meter (docs/usage-limits.md D6) — refreshed on mount, after each turn, and
       on open. Silent on failure; the last-known meter stands. */
    async loadUsage() {
      const usage = await fetchUsage()
      if (usage) dispatch.chat.set({ usage })
    },
    async loadConversations() {
      try {
        dispatch.chat.set({ conversations: await listConversations() })
      } catch {
        /* offline — leave the last-known list */
      }
    },
    /* Switch the panel to an existing conversation: adopt its server transcript, reset the
       live turn state so nothing from the previous thread bleeds across. */
    async openConversation(id: string, state) {
      if (state.chat.streaming) dispatch.chat.stop()
      const remote = await fetchConversation(id)
      if (!remote) {
        // Vanished (deleted elsewhere) — drop it from the list and start fresh.
        dispatch.chat.clearConversation()
        await dispatch.chat.loadConversations()
        return
      }
      dispatch.chat.set({
        conversationId: id,
        turnId: '',
        title: remote.title || '',
        streaming: false,
        pendingConfirmation: null,
        error: null,
        messages: remote.messages.map(m =>
          m.role === 'assistant'
            ? { role: 'assistant' as const, text: m.content, toolCalls: [] }
            : { role: 'user' as const, text: m.content }
        ),
      })
    },
    /* Delete a conversation for real (D9). If it's the one on screen, clear to a new chat. */
    async removeConversation(id: string, state) {
      await deleteConversation(id)
      if (state.chat.conversationId === id) dispatch.chat.clearConversation()
      await dispatch.chat.loadConversations()
    },
    /* App sign-out: nothing agent-specific to revoke — the session's end IS the
       chat's end. The transcript reset is dispatched by auth.signedOut alongside
       the other model resets — dispatching it here would land in the
       purge-to-reload window and re-persist the pre-signout state. */
    async signOut() {
      broadcastChatSignout()
      abortController?.abort()
      abortController = null
      // Explicit sign-out ends the background relationship too (plan D8): best-effort
      // revoke of the agent's stored grant, before the session tokens vanish.
      void backgroundDisable()
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
      state.title = payload.title
      state.orgId = payload.orgId
      return state
    },
    clearConversation(state: IChatState) {
      state.messages = []
      state.conversationId = ''
      state.turnId = ''
      state.title = ''
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
