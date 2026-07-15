import { createModel } from '@rematch/core'
import { RootModel } from '.'
import { streamChat, confirmTool, agentHealth, AgentEvent, AgentMessageParam } from '../services/agent'

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
  streaming: boolean
  pendingConfirmation: { toolUseId: string; toolName: string; input: Record<string, unknown> } | null
  error: string | null
  health: 'unknown' | 'ok' | 'unreachable'
}

export const defaultChatState: IChatState = {
  open: false,
  expanded: false,
  messages: [],
  conversationId: '',
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
      state.error = event.message
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
      try {
        await streamChat({
          conversationId,
          messages,
          signal: abortController.signal,
          onEvent: event => dispatch.chat.applyEvent(event),
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError')
          dispatch.chat.applyEvent({ type: 'error', message: (error as Error).message })
      } finally {
        abortController = null
        dispatch.chat.set({ streaming: false })
      }
    },
    async confirm(approved: boolean, state) {
      const pending = state.chat.pendingConfirmation
      if (!pending) return
      try {
        await confirmTool({
          conversationId: state.chat.conversationId,
          toolUseId: pending.toolUseId,
          approved,
        })
        dispatch.chat.set({ pendingConfirmation: null })
      } catch (error) {
        dispatch.chat.set({ error: (error as Error).message })
      }
    },
    async stop() {
      abortController?.abort()
      abortController = null
      dispatch.chat.set({ streaming: false, pendingConfirmation: null })
    },
    async checkHealth() {
      dispatch.chat.set({ health: (await agentHealth()) ? 'ok' : 'unreachable' })
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
    clearConversation(state: IChatState) {
      state.messages = []
      state.conversationId = ''
      state.streaming = false
      state.pendingConfirmation = null
      state.error = null
      return state
    },
  },
})
