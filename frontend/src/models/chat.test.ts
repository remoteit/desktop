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
// The org selector's real dependency chain (selectors/state → services/browser) is the app's;
// the model test needs only its answer.
vi.mock('../selectors/accounts', () => ({
  selectActiveAccountId: (s: any) => s.accounts?.activeId || s.auth?.user?.id || '',
  isUserAccount: (s: any) => !s.accounts?.activeId || s.accounts.activeId === s.auth?.user?.id,
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
    endTurn: vi.fn(),
    unauthorized: vi.fn(),
    loadUsage: vi.fn(),
  },
  chatLive: { append: vi.fn(), toolStart: vi.fn(), toolResult: vi.fn(), clear: vi.fn() },
})
// The wider snapshot send() reads (resolveChatOrg looks at the user and memberships)
const sendable = (chat: Record<string, unknown> = {}) => ({
  ...current(chat),
  auth: { user: { id: 'u' } },
  accounts: { activeId: '', membership: [] },
  organization: { accounts: {} },
})

// A fetch the test resolves by hand, to interleave user actions with an in-flight request.
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => (resolve = r))
  return { promise, resolve }
}

// A conversation as the effect sees it at invocation time (the rematch `state` snapshot).
const current = (over: Record<string, unknown> = {}) => ({
  chat: { conversationId: 'a', streaming: false, messages: [], title: '', ...over },
})
const remote = {
  messages: [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'yo' },
  ],
  title: 'T',
}
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
  ;(storeState as any).chatLive = { reply: null }
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
    const a = deferred<any>()
    fetchConversation.mockImplementationOnce(() => a.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const openA = fx.openConversation('A', current())
    await fx.send('hello', sendable()) // the composer stays enabled during a pick; a send commits
    a.resolve(remote)
    await openA
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
    expect(dispatch.chat.endTurn).toHaveBeenCalled() // turnEnded clears the pending approval
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
    expect(dispatch.chat.endTurn).toHaveBeenCalled()
  })
})

/* A stream whose abort lands AFTER stop() folded the reply: the delta still buffered (and the
   flush timer still pending) must not re-open a reply that then lands as a stray message. */
describe('chat model — a stop mid-stream folds the reply exactly once', () => {
  // The stream as send() sees it: events arrive by hand, and an abort rejects the way fetch does.
  const abortableStream = () => {
    let onEvent!: (event: unknown) => void
    streamChat.mockImplementation(
      (options: any) =>
        new Promise((_, reject) => {
          onEvent = options.onEvent
          options.signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          )
        })
    )
    return { deliver: (event: unknown) => onEvent(event) }
  }

  it('a delta buffered at the abort is dropped — not appended after the fold — and the finally asks the agent for nothing', async () => {
    vi.useFakeTimers()
    try {
      const stream = abortableStream()
      const dispatch = makeDispatch()
      const fx = effectsFor(dispatch)
      const sending = fx.send('hello', sendable())
      stream.deliver({ type: 'text_delta', text: 'tail' }) // buffered behind the 50ms flush timer
      await fx.stop(undefined, current({ streaming: true }))
      await sending
      vi.runAllTimers() // the flush timer fires after the fold
      expect(dispatch.chatLive.append).not.toHaveBeenCalled()
      expect(dispatch.chat.endTurn).toHaveBeenCalledTimes(1) // stop()'s own fold
      expect(dispatch.chat.loadConversations).not.toHaveBeenCalled()
      expect(dispatch.chat.loadUsage).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('an unknown event type is ignored rather than read as an error event', async () => {
    const stream = abortableStream()
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const sending = fx.send('hello', sendable())
    expect(() => stream.deliver({ type: 'ping', at: 1 })).not.toThrow()
    stream.deliver({ type: 'error', message: 'reauth_required: expired' })
    expect(dispatch.chat.endTurn).toHaveBeenCalledWith('notices:chat.sessionExpired')
    await fx.stop(undefined, current({ streaming: true }))
    await sending
  })
})

/* A stream the server closed cleanly mid-answer must end the turn as an interruption — not
   resolve like a completion with a truncated reply on screen and the composer open. */
describe('chat model — send() treats a cut-off stream as an interrupted turn', () => {
  it('ends the turn on AgentStreamEndedError with the cut-off as its error (which marks the reply Interrupted)', async () => {
    streamChat.mockRejectedValue(new AgentStreamEndedError())
    const dispatch = makeDispatch()
    await effectsFor(dispatch).send('hello', sendable())
    expect(dispatch.chat.endTurn).toHaveBeenCalledWith('notices:chat.streamEnded')
  })
})

/* The popout persists nothing, so it boots on the PERSONAL account unless told otherwise —
   and a chat licensed only for an organization would then be refused in its own popout. */
describe('chat model — popOut hands over the account scope', () => {
  it('passes the current org to openChatPopout', async () => {
    openChatPopout.mockReturnValue(true)
    const dispatch = makeDispatch()
    await effectsFor(dispatch).popOut(undefined, { chat: {}, accounts: { activeId: 'org-1' } })
    expect(openChatPopout).toHaveBeenCalledWith('org-1')
    expect(dispatch.chat.set).not.toHaveBeenCalled() // no popup-blocked error
  })
})

/* The fetch can outlive the conversation it was for. Applying its result against the
   invocation-time snapshot would drop the OLD transcript into whatever conversation is
   on screen now — under that conversation's newer id — or repopulate one just cleared.
   Every such event — a pick, a New Chat, a send, a handoff — advances the generation the
   sync took its ticket from; that ticket is the whole check. */
describe('chat model — syncTranscript discards a response for a conversation no longer active', () => {
  it('drops the response when the user moved to another conversation mid-fetch', async () => {
    const sync = deferred<any>()
    fetchConversation.mockImplementationOnce(() => sync.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const syncing = fx.syncTranscript(undefined, current())
    await fx.newConversation() // a New Chat while the fetch was in flight
    sync.resolve(remote)
    await syncing
    expect(fetchConversation).toHaveBeenCalledWith('a')
    expect(dispatch.chat.set).not.toHaveBeenCalled()
  })

  it('drops the response when a turn started mid-fetch', async () => {
    const sync = deferred<any>()
    fetchConversation.mockImplementationOnce(() => sync.promise)
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    const syncing = fx.syncTranscript(undefined, current())
    await fx.send('hello', sendable())
    sync.resolve(remote)
    await syncing
    expect(dispatch.chat.set).not.toHaveBeenCalledWith(expect.objectContaining({ messages: remoteAsLocal }))
  })

  it('drops the response when the other window handed its conversation over mid-fetch', async () => {
    const sync = deferred<any>()
    fetchConversation.mockImplementationOnce(() => sync.promise)
    const dispatch = { ...makeDispatch(), chat: { ...makeDispatch().chat, adoptTranscript: vi.fn() } }
    const fx = effectsFor(dispatch)
    const syncing = fx.syncTranscript(undefined, current())
    await fx.adoptHandoff({ messages: [], conversationId: 'b', title: '' })
    sync.resolve(remote)
    await syncing
    expect(dispatch.chat.adoptTranscript).toHaveBeenCalled()
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

/* The background grant is revoked ONCE per identity. "Sign out everywhere" (models/auth) revokes
   it before the AS ends the session, and the local teardown that follows calls signOut again —
   a second enrollment DELETE, and another bounded wait on a slow agent, for nothing. reset()
   ends every teardown and re-arms it for the next identity. */
describe('chat model — the background grant is revoked once per identity', () => {
  const reducers = (chatModel as any).reducers
  const signedInAs = (id: string) => ({ auth: { user: { id } } })
  it('a second signOut for the same identity issues no second revoke; reset re-arms it', async () => {
    reducers.reset({}) // whatever an earlier test left behind
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    await fx.signOut(undefined, signedInAs('alice'))
    await fx.signOut(undefined, signedInAs('alice'))
    expect(backgroundDisable).toHaveBeenCalledTimes(1)
    reducers.reset({})
    await fx.signOut(undefined, signedInAs('alice'))
    expect(backgroundDisable).toHaveBeenCalledTimes(2)
    reducers.reset({}) // leave the module armed for the tests that follow
  })
  it('a DIFFERENT identity is never skipped', async () => {
    reducers.reset({})
    const dispatch = makeDispatch()
    const fx = effectsFor(dispatch)
    await fx.signOut(undefined, signedInAs('alice'))
    await fx.signOut(undefined, signedInAs('bob'))
    expect(backgroundDisable).toHaveBeenCalledTimes(2)
    reducers.reset({})
  })
})

/* The reply in flight lives in models/chatLive so the token stream never touches the persisted
   chat slice; it joins the transcript exactly once, when the turn ends. */
describe('chat model — the reply in flight lands once, when the turn ends', () => {
  const partial = { role: 'assistant' as const, text: 'so far', toolCalls: [] }

  it('endTurn folds the live reply into the transcript — Interrupted when an error ended the turn', async () => {
    ;(storeState as any).chatLive = { reply: partial }
    const dispatch = { ...makeDispatch(), chat: { ...makeDispatch().chat, turnEnded: vi.fn() } }
    await effectsFor(dispatch).endTurn('cut off')
    expect(dispatch.chatLive.clear).toHaveBeenCalled()
    expect(dispatch.chat.turnEnded).toHaveBeenCalledWith({ reply: { ...partial, interrupted: true }, error: 'cut off' })
  })

  it('a completed turn folds the reply as it is; a second endTurn finds nothing in flight', async () => {
    ;(storeState as any).chatLive = { reply: partial }
    const dispatch = { ...makeDispatch(), chat: { ...makeDispatch().chat, turnEnded: vi.fn() } }
    await effectsFor(dispatch).endTurn()
    expect(dispatch.chat.turnEnded).toHaveBeenCalledWith({ reply: partial, error: undefined })
    ;(storeState as any).chatLive = { reply: null }
    await effectsFor(dispatch).endTurn()
    expect(dispatch.chat.turnEnded).toHaveBeenLastCalledWith({ reply: null, error: undefined })
    expect(dispatch.chatLive.clear).toHaveBeenCalledTimes(1)
  })

  it('turnEnded appends the reply and clears the turn state', () => {
    const reducers = (chatModel as any).reducers
    const before = {
      ...reducers.reset({}),
      messages: [{ role: 'user', text: 'hi' }],
      streaming: true,
      pendingConfirmation: { toolUseId: 't', toolName: 'n', input: {} },
    }
    const after = reducers.turnEnded(before, { reply: partial, error: undefined })
    expect(after.messages).toEqual([{ role: 'user', text: 'hi' }, partial])
    expect(after.streaming).toBe(false)
    expect(after.pendingConfirmation).toBeNull()
    const untouched = reducers.turnEnded({ ...before, messages: [] }, { reply: null, error: 'x' })
    expect(untouched.messages).toEqual([])
    expect(untouched.error).toBe('x')
  })
})
