import { describe, it, expect, vi, beforeEach } from 'vitest'

// The chat model pulls in the agent service, the popout protocol and the store at import time;
// stub them so the syncTranscript EFFECT runs in isolation. fetchConversation is the one real
// spy — each test scripts what the server returns and, crucially, what the user does to the
// live store WHILE that fetch is in flight. The store is a hoisted MUTABLE object for that.
const { fetchConversation, storeState } = vi.hoisted(() => ({
  fetchConversation: vi.fn(),
  storeState: { chat: {} as Record<string, unknown> },
}))

vi.mock('../services/agent', () => ({
  fetchConversation,
  streamChat: vi.fn(),
  confirmTool: vi.fn(),
  backgroundDisable: vi.fn(),
  listConversations: vi.fn(),
  deleteConversation: vi.fn(),
  fetchUsage: vi.fn(),
  agentHealth: vi.fn(),
  UsageLimitError: class UsageLimitError extends Error {},
  AgentAuthError: class AgentAuthError extends Error {},
}))
vi.mock('../services/chatPopout', () => ({
  broadcastChatSignout: vi.fn(),
  openChatPopout: vi.fn(),
  popIn: vi.fn(),
}))
vi.mock('../store', () => ({ store: { getState: () => storeState } }))
vi.mock('../constants', () => ({ CHAT_PANEL_WIDTH: 400 }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import chatModel from './chat'

const effectsFor = (dispatch: any) => (chatModel as any).effects(dispatch)
const makeDispatch = () => ({ chat: { set: vi.fn() } })

// A conversation as the effect sees it at invocation time (the rematch `state` snapshot).
const current = (over: Record<string, unknown> = {}) => ({
  chat: { conversationId: 'a', streaming: false, messages: [], title: '', ...over },
})
const remote = { messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'yo' }], title: 'T' }
const remoteAsLocal = [
  { role: 'user', text: 'hi' },
  { role: 'assistant', text: 'yo', toolCalls: [] },
]

beforeEach(() => {
  fetchConversation.mockReset()
  storeState.chat = { conversationId: 'a', streaming: false, messages: [], title: '' }
})

/* The fetch can outlive the conversation it was for. Applying its result against the
   invocation-time snapshot would drop the OLD transcript into whatever conversation is
   on screen now — under that conversation's newer id — or repopulate one just cleared. */
describe('chat model — syncTranscript discards a response for a conversation no longer active', () => {
  it('drops the response when the user moved to another conversation mid-fetch', async () => {
    fetchConversation.mockImplementation(async () => {
      storeState.chat.conversationId = 'b' // a history pick / New Chat while the fetch was in flight
      return remote
    })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).syncTranscript(undefined, current())
    expect(fetchConversation).toHaveBeenCalledWith('a')
    expect(dispatch.chat.set).not.toHaveBeenCalled()
  })

  it('drops the response when a turn started mid-fetch', async () => {
    fetchConversation.mockImplementation(async () => {
      storeState.chat.streaming = true
      return remote
    })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).syncTranscript(undefined, current())
    expect(dispatch.chat.set).not.toHaveBeenCalled()
  })

  it('applies the server copy against the LIVE store, not the invocation snapshot', async () => {
    // The snapshot already matches the server (a snapshot-based compare would find nothing to
    // do), while the live store has been cleared underneath it — the live compare must win.
    fetchConversation.mockResolvedValue(remote)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).syncTranscript(undefined, current({ messages: remoteAsLocal, title: 'T' }))
    expect(dispatch.chat.set).toHaveBeenCalledTimes(1)
    expect(dispatch.chat.set).toHaveBeenCalledWith({ messages: remoteAsLocal, title: 'T' })
  })

  it('leaves an already-current transcript alone (no redundant set)', async () => {
    storeState.chat = { conversationId: 'a', streaming: false, messages: remoteAsLocal, title: 'T' }
    fetchConversation.mockResolvedValue(remote)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).syncTranscript(undefined, current({ messages: remoteAsLocal, title: 'T' }))
    expect(dispatch.chat.set).not.toHaveBeenCalled()
  })
})
