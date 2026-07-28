import { createModel } from '@rematch/core'
import { RootModel } from '.'
import {
  streamChat,
  confirmTool,
  agentHealth,
  setAgentToken,
  AgentAuthError,
  AgentEvent,
  AgentHealth,
  AgentMessageParam,
  OrgSelection,
} from '../services/agent'
import { startAgentSignIn, handleAgentSignInCallback, ensureFreshAgentToken, agentSignOut } from '../services/hydra'
import { ChatHandoff, broadcastChatSignout } from '../services/chatPopout'

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
        state.error = 'Agent session expired — sign in again to continue.'
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
function toMessageParams(messages: ChatTranscriptMessage[]): AgentMessageParam[] {
  return messages.filter(m => m.text.trim().length > 0).map(m => ({ role: m.role, content: m.text }))
}

let abortController: AbortController | null = null
// orgId is redux-persisted but must not survive a reload (spec: "not
// persisted"); on the first syncOrg after load, force-adopt the app's active
// org regardless of what was rehydrated. After that, intra-session
// divergence (the user picking a different org in the panel) is left alone.
let orgSynced = false

export default createModel<RootModel>()({
  state: { ...defaultChatState },
  effects: dispatch => ({
    async send(text: string, state) {
      if (state.chat.streaming || state.chat.pendingConfirmation) return
      const conversationId = state.chat.conversationId || crypto.randomUUID()
      const messages = toMessageParams([...state.chat.messages, { role: 'user', text }])
      dispatch.chat.addUserMessage(text)
      dispatch.chat.set({ conversationId, streaming: true, error: null })
      abortController = new AbortController()
      const orgId = state.chat.orgId
      let org: OrgSelection | undefined
      if (orgId && orgId !== state.user.id) {
        // organization.accounts can be unloaded while the membership is
        // present; fall back to the name carried on the membership itself so
        // org scope never silently degrades to personal.
        const name = (
          state.organization.accounts[orgId]?.name ||
          state.accounts.membership.find(m => m.account.id === orgId)?.name ||
          ''
        ).trim()
        const isMember = state.accounts.membership.some(m => m.account.id === orgId)
        if (name && isMember) org = { id: orgId, name }
      }
      try {
        await ensureFreshAgentToken()
        await streamChat({
          conversationId,
          messages,
          org,
          signal: abortController.signal,
          onEvent: event => dispatch.chat.applyEvent(event),
        })
      } catch (error) {
        if (error instanceof AgentAuthError)
          dispatch.chat.set({ error: 'Agent authentication required — sign in to continue.', health: 'unauthorized' })
        else if ((error as Error).name !== 'AbortError')
          dispatch.chat.applyEvent({ type: 'error', message: (error as Error).message })
      } finally {
        abortController = null
        dispatch.chat.set({ streaming: false })
      }
    },
    /* Default the chat org to the app's active org when unset or no longer valid.
       orgId is not persisted across reloads: the first sync after load always
       adopts the app's active org, discarding whatever was rehydrated. */
    async syncOrg(_: void, state) {
      const userId = state.user.id
      if (!orgSynced) {
        orgSynced = true
        dispatch.chat.set({ orgId: state.accounts.activeId || userId })
        return
      }
      const validIds = new Set([userId, ...state.accounts.membership.map(m => m.account.id)])
      if (!state.chat.orgId || !validIds.has(state.chat.orgId)) {
        dispatch.chat.set({ orgId: state.accounts.activeId || userId })
      }
    },
    async confirm(approved: boolean, state) {
      const pending = state.chat.pendingConfirmation
      if (!pending) return
      try {
        await ensureFreshAgentToken()
        await confirmTool({
          conversationId: state.chat.conversationId,
          toolUseId: pending.toolUseId,
          approved,
        })
        dispatch.chat.set({ pendingConfirmation: null })
      } catch (error) {
        if (error instanceof AgentAuthError)
          dispatch.chat.set({ error: 'Agent authentication required — sign in to continue.', health: 'unauthorized' })
        else dispatch.chat.set({ error: (error as Error).message })
      }
    },
    async stop() {
      abortController?.abort()
      abortController = null
      dispatch.chat.set({ streaming: false, pendingConfirmation: null })
    },
    async checkHealth() {
      await ensureFreshAgentToken()
      dispatch.chat.set({ health: await agentHealth() })
    },
    /* Full-page redirect to the Hydra login (registers a client first if
       needed); handleSignInCallback picks up the return after reload */
    async signIn() {
      try {
        await startAgentSignIn()
      } catch (error) {
        dispatch.chat.set({ error: (error as Error).message })
      }
    },
    /* Complete a sign-in redirect if this page load carries one */
    async handleSignInCallback() {
      const result = await handleAgentSignInCallback()
      if (!result) return
      if (result.ok) dispatch.chat.set({ error: null, open: true })
      else dispatch.chat.set({ error: `Agent sign-in failed — ${result.error}`, open: true })
      await dispatch.chat.checkHealth()
    },
    // Dev fallback: token pasted from the ai-agent harness (devtools:
    // localStorage.agentToken). The sign-in flow is the normal writer.
    async setToken(token: string) {
      setAgentToken(token)
      dispatch.chat.set({ error: null })
      await dispatch.chat.checkHealth()
    },
    /* App sign-out tears the agent session down with it: revoke + clear the
       Hydra credentials and drop the transcript */
    async signOut() {
      broadcastChatSignout()
      abortController?.abort()
      abortController = null
      dispatch.chat.reset()
      await agentSignOut()
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
