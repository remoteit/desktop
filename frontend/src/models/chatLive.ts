import { createModel } from '@rematch/core'
import { RootModel } from '.'
import type { ChatAssistantMessage } from './chat'

/* The assistant's reply IN FLIGHT, kept out of `chat`. `chat` is persisted, and redux-persist
   re-serialises every whitelisted slice and rewrites the whole store on any change to one of
   them — which the token stream was causing twenty times a second for the length of every turn,
   buying nothing: the server owns the transcript and a reload reconciles from it
   (chat.syncTranscript). This slice is never persisted; chat.endTurn folds the reply into
   chat.messages once, when the turn ends. */
export type IChatLiveState = { reply: ChatAssistantMessage | null }

export default createModel<RootModel>()({
  state: { reply: null } as IChatLiveState,
  reducers: {
    append(state: IChatLiveState, text: string) {
      state.reply ??= { role: 'assistant', text: '', toolCalls: [] }
      state.reply.text += text
      return state
    },
    toolStart(state: IChatLiveState, call: { id: string; name: string; input: Record<string, unknown> }) {
      state.reply ??= { role: 'assistant', text: '', toolCalls: [] }
      state.reply.toolCalls.push({ ...call, status: 'running' })
      return state
    },
    toolResult(state: IChatLiveState, outcome: { id: string; result: string; isError: boolean }) {
      const call = state.reply?.toolCalls.find(c => c.id === outcome.id)
      if (call) {
        call.status = outcome.isError ? 'error' : 'done'
        call.result = outcome.result
      }
      return state
    },
    clear(state: IChatLiveState) {
      state.reply = null
      return state
    },
  },
})
