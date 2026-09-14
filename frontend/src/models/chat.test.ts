import { describe, it, expect, vi, beforeEach } from 'vitest'

// The chat model pulls in the agent service, the popout protocol and the store at import time;
// stub them so the syncTranscript EFFECT runs in isolation. fetchConversation is the one real
// spy — each test scripts what the server returns and, crucially, what the user does to the
// live store WHILE that fetch is in flight. The store is a hoisted MUTABLE object for that.
const {
  fetchConversation,
  deleteConversation,
  streamChat,
  confirmTool,
  backgroundDisable,
  listConversations,
  agentHealth,
  openChatPopout,
  storeState,
} = vi.hoisted(() => ({
  fetchConversation: vi.fn(),
  deleteConversation: vi.fn(),
  streamChat: vi.fn(),
  confirmTool: vi.fn(),
  backgroundDisable: vi.fn(),
  listConversations: vi.fn(),
  agentHealth: vi.fn(),
  openChatPopout: vi.fn(),
  storeState: { chat: {} as Record<string, unknown> },
}))

vi.mock('../services/agent', () => ({
  fetchConversation,
  deleteConversation,
  streamChat,
  confirmTool,
  backgroundDisable,
  listConversations,
  fetchUsage: vi.fn(),
  agentHealth,
  UsageLimitError: class UsageLimitError extends Error {},
  AgentAuthError: class AgentAuthError extends Error {},
  AgentStreamEndedError: class AgentStreamEndedError extends Error {},
}))
vi.mock('../services/chatPopout', () => ({
  broadcastChatSignout: vi.fn(),
  openChatPopout,
  popIn: vi.fn(),
}))
vi.mock('../store', () => ({ store: { getState: () => storeState } }))
vi.mock('../constants', () => ({ CHAT_PANEL_WIDTH: 400 }))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))

import chatModel from './chat'
// The mocked module's class — the same one chat.ts's instanceof sees
import { AgentStreamEndedError } from '../services/agent'

const effectsFor = (dispatch: any) => (chatModel as any).effects(dispatch)
const makeDispatch = () => ({
  chat: {
    set: vi.fn(),
    stop: vi.fn(),
    clearConversation: vi.fn(),
    loadConversations: vi.fn(),
    newConversation: vi.fn(),
    // what send() touches around its (mocked, instantly-resolving) streamChat
    addUserMessage: vi.fn(),
    applyEvent: vi.fn(),
    loadUsage: vi.fn(),
  },
})
// The wider snapshot send() reads (resolveChatOrg looks at the user and memberships)
const sendable = (chat: Record<string, unknown> = {}) => ({ ...current(chat), user: { id: 'u' }, accounts: { membership: [] } })

// A fetch the test resolves by hand, to interleave user actions with an in-flight request.
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => (resolve = r))
  return { promise, resolve }
}

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
  deleteConversation.mockReset()
  streamChat.mockReset()
  confirmTool.mockReset()
  backgroundDisable.mockReset().mockResolvedValue(undefined)
  listConversations.mockReset()
  agentHealth.mockReset()
  openChatPopout.mockReset()
  storeState.chat = { conversationId: 'a', streaming: false, messages: [], title: '' }
})

// What openConversation writes for a loaded conversation — the shape the out-of-order tests
// look for, so they can tell WHICH load landed.
const opened = (id: string) => expect.objectContaining({ conversationId: id })

/* A pick from the history is a request that may lose the race with the next pick. Without a
   generation check, "A then B, A lands last" leaves A on screen under B's selection. */
describe('chat model — openConversation applies only the latest selection', () => {
  it('a slower earlier pick (A) does not replace the later one (B)', async () => {
    const a = deferred<any>()
    const b = deferred<any>()
    fetchConversation.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const openA = fx.openConversation('A', current())
    const openB = fx.openConversation('B', current())
    b.resolve({ ...remote, title: 'B' })
    await openB
    a.resolve({ ...remote, title: 'A' }) // A finishes last
    await openA
    expect(dispatch.chat.set).toHaveBeenCalledWith(opened('B'))
    expect(dispatch.chat.set).not.toHaveBeenCalledWith(opened('A'))
  })

  it('a New Chat during a slow pick is not undone when that pick lands', async () => {
    const a = deferred<any>()
    fetchConversation.mockImplementationOnce(() => a.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const openA = fx.openConversation('A', current())
    await fx.newConversation() // takes the next ticket
    a.resolve(remote)
    await openA
    expect(dispatch.chat.set).not.toHaveBeenCalledWith(opened('A'))
  })

  it('a turn the user started meanwhile is not clobbered by the landing pick', async () => {
    fetchConversation.mockImplementation(async () => {
      storeState.chat.streaming = true // the composer stays enabled during a pick
      return remote
    })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).openConversation('A', current())
    expect(dispatch.chat.set).not.toHaveBeenCalledWith(opened('A'))
  })

  it('a turn that starts AND finishes during a slow pick still invalidates it', async () => {
    const a = deferred<any>()
    fetchConversation.mockImplementationOnce(() => a.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const openA = fx.openConversation('A', current())
    // The whole turn runs to completion while A is still loading — streaming is false again by
    // the time A lands, so only the ticket send() took can tell the load is stale.
    await fx.send('hello', sendable())
    expect(storeState.chat.streaming).toBe(false)
    a.resolve(remote)
    await openA
    expect(dispatch.chat.set).not.toHaveBeenCalledWith(opened('A'))
  })

  it('a stale pick that 404s still refreshes the list but does not clear the conversation now on screen', async () => {
    const a = deferred<any>()
    fetchConversation.mockImplementationOnce(() => a.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const openA = fx.openConversation('A', current())
    await fx.newConversation() // clears once, itself
    a.resolve(null) // A was deleted elsewhere
    await openA
    expect(dispatch.chat.loadConversations).toHaveBeenCalled()
    // Only New Chat's own clear — the stale 404 must not clear the fresh conversation again
    expect(dispatch.chat.clearConversation).toHaveBeenCalledTimes(1)
  })

  it('a current pick still applies (control)', async () => {
    fetchConversation.mockResolvedValue(remote)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).openConversation('A', current())
    expect(dispatch.chat.set).toHaveBeenCalledWith(opened('A'))
  })

  /* Aborting on sign-out covers only the STREAM. A slow pick started under one account passed
     its own guard after the reset (ticket unchanged, nothing streaming) and wrote that account's
     transcript into the store the next account boots from. */
  it('a pick still in flight at sign-out never lands — not even after the next account is in', async () => {
    const a = deferred<any>()
    fetchConversation.mockImplementationOnce(() => a.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const openA = fx.openConversation('A', current())
    await fx.signOut()
    storeState.chat = { conversationId: '', streaming: false, messages: [], title: '' } // reset, next user booting
    a.resolve(remote)
    await openA
    expect(dispatch.chat.set).not.toHaveBeenCalledWith(opened('A'))
  })
})

/* A sync is a background reconcile against the server. One that outlives a turn the user
   started AND finished meanwhile sees the same id and streaming false again — and without the
   generation it applied the older server snapshot, removing the just-completed turn from view. */
describe('chat model — syncTranscript is invalidated by a turn that completes during it', () => {
  it('drops the stale server snapshot after a send', async () => {
    const sync = deferred<any>()
    fetchConversation.mockImplementationOnce(() => sync.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const syncing = fx.syncTranscript(undefined, current())
    await fx.send('hello', sendable()) // whole turn completes; streaming false again, same id
    sync.resolve(remote) // the older snapshot, without the new turn
    await syncing
    expect(dispatch.chat.set).not.toHaveBeenCalledWith(expect.objectContaining({ messages: expect.anything() }))
  })
})

/* Probes that are not conversation-scoped get latest-wins tickets instead: an older response
   landing last must not overwrite a newer one. */
describe('chat model — independent probes are latest-wins', () => {
  const online = { ui: { offline: false }, chat: {} }

  it('an older, slower health probe cannot flip a fresh ok back to unreachable', async () => {
    const slow = deferred<string>()
    agentHealth.mockImplementationOnce(() => slow.promise).mockResolvedValueOnce('ok')
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const first = fx.checkHealth(undefined, online) // started while connectivity was failing…
    await fx.checkHealth(undefined, online) // …the reconnect-triggered probe lands first
    slow.resolve('unreachable')
    await first
    expect(dispatch.chat.set).toHaveBeenCalledWith({ health: 'ok' })
    expect(dispatch.chat.set).not.toHaveBeenCalledWith({ health: 'unreachable' })
  })

  it('an older, slower history-list load cannot overwrite a newer one', async () => {
    const slow = deferred<unknown[]>()
    listConversations.mockImplementationOnce(() => slow.promise).mockResolvedValueOnce([{ id: 'new' }])
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const first = fx.loadConversations()
    await fx.loadConversations()
    slow.resolve([{ id: 'old' }])
    await first
    expect(dispatch.chat.set).toHaveBeenCalledWith({ conversations: [{ id: 'new' }] })
    expect(dispatch.chat.set).not.toHaveBeenCalledWith({ conversations: [{ id: 'old' }] })
  })
})

/* Deleting is a request too: it can fail without an HTTP response, and it can be slow enough
   for the user to have moved to another conversation before it lands. */
describe('chat model — removeConversation', () => {
  const deleteFailed = expect.objectContaining({ error: 'notices:chat.deleteFailed' })

  it('reports a REJECTED delete (no HTTP response) exactly like a failed one, and keeps the transcript', async () => {
    deleteConversation.mockRejectedValue(new TypeError('Failed to fetch'))
    const dispatch = makeDispatch()
    await expect(effectsFor(dispatch).removeConversation('a')).resolves.toBeUndefined()
    expect(dispatch.chat.set).toHaveBeenCalledWith(deleteFailed)
    expect(dispatch.chat.newConversation).not.toHaveBeenCalled()
    expect(dispatch.chat.loadConversations).not.toHaveBeenCalled()
  })

  it('clears the conversation only if it is STILL the one on screen when the delete lands', async () => {
    deleteConversation.mockImplementation(async () => {
      storeState.chat.conversationId = 'b' // the user opened B while A was being deleted
      return true
    })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).removeConversation('a')
    expect(dispatch.chat.newConversation).not.toHaveBeenCalled()
    expect(dispatch.chat.loadConversations).toHaveBeenCalled()
  })

  it('clears a conversation the user opened DURING its own deletion', async () => {
    storeState.chat.conversationId = 'c'
    deleteConversation.mockImplementation(async () => {
      storeState.chat.conversationId = 'a' // deleted A from the picker, then opened A before it landed
      return true
    })
    const dispatch = makeDispatch()
    await effectsFor(dispatch).removeConversation('a')
    expect(dispatch.chat.newConversation).toHaveBeenCalledTimes(1)
  })
})

/* A pending approval is part of the turn: abandoning the turn must DENY it, or the server-side
   turn waits on a card no window shows any more. stop() is the one place every abandonment path
   (Stop, New Chat, delete, identity change, unmount) runs through. */
describe('chat model — stop() denies a pending approval', () => {
  const pending = { toolUseId: 'tool-9', name: 'update_device', input: {} }

  it('sends an explicit deny for the pending tool before clearing it', async () => {
    confirmTool.mockResolvedValue(undefined)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).stop(undefined, current({ turnId: 'turn-1', pendingConfirmation: pending }))
    expect(confirmTool).toHaveBeenCalledWith({ turnId: 'turn-1', toolUseId: 'tool-9', approved: false })
    expect(dispatch.chat.set).toHaveBeenCalledWith({ streaming: false, pendingConfirmation: null })
  })

  it('sends nothing when no approval is pending', async () => {
    const dispatch = makeDispatch()
    await effectsFor(dispatch).stop(undefined, current({ turnId: 'turn-1', pendingConfirmation: null }))
    expect(confirmTool).not.toHaveBeenCalled()
  })

  it('never waits on, or fails from, the deny (best-effort)', async () => {
    confirmTool.mockRejectedValue(new Error('offline'))
    const dispatch = makeDispatch()
    await expect(
      effectsFor(dispatch).stop(undefined, current({ turnId: 'turn-1', pendingConfirmation: pending }))
    ).resolves.toBeUndefined()
    expect(dispatch.chat.set).toHaveBeenCalledWith({ streaming: false, pendingConfirmation: null })
  })
})

/* A stream the server closed cleanly mid-answer must end the turn as an interruption — not
   resolve like a completion with a truncated reply on screen and the composer open. */
describe('chat model — send() treats a cut-off stream as an interrupted turn', () => {
  it('maps AgentStreamEndedError to an error event (which marks the reply Interrupted)', async () => {
    streamChat.mockRejectedValue(new AgentStreamEndedError())
    const dispatch = makeDispatch()
    await effectsFor(dispatch).send('hello', sendable())
    expect(dispatch.chat.applyEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', message: 'notices:chat.streamEnded' })
    )
    expect(dispatch.chat.set).toHaveBeenCalledWith({ streaming: false })
  })
})

/* The popout persists nothing, so it boots on the PERSONAL account unless told otherwise —
   and a chat licensed only for an organization would then be refused in its own popout. */
describe('chat model — popOut hands over the account scope', () => {
  it('passes the current org to openChatPopout', async () => {
    openChatPopout.mockReturnValue(true)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).popOut(undefined, { chat: { orgId: 'org-1' } })
    expect(openChatPopout).toHaveBeenCalledWith('org-1')
    expect(dispatch.chat.set).not.toHaveBeenCalled() // no popup-blocked error
  })
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
