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
  AgentStreamEndedError,
  type ConversationSummary,
  type Usage,
  agentHealth,
  AgentAuthError,
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
import { withTimeout } from '../helpers/sleep'
import { latestWins } from '../helpers/latestWins'
import { formatReset } from '../helpers/dateHelper'
import { selectActiveAccountId, isUserAccount } from '../selectors/accounts'

export type ChatToolCall = {
  id: string
  name: string
  input: Record<string, unknown>
  status: 'running' | 'done' | 'error'
  result?: string
}

export type ChatAssistantMessage = { role: 'assistant'; text: string; toolCalls: ChatToolCall[]; interrupted?: boolean }
export type ChatTranscriptMessage = { role: 'user'; text: string } | ChatAssistantMessage

export type IChatState = {
  open: boolean
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
  poppedOut: false,
  streaming: false,
  pendingConfirmation: null,
  error: null,
  health: 'unknown',
}

/* The org the chat is scoped to (null = personal): the app's active account, read from the same
   selector the rest of the app uses — no copy of it to keep in step, in either window (the popout
   boots under the scope it was opened with). Membership decides, so the Current Org label and the
   org sent with each turn can never disagree; the name falls back to the membership record when
   organization.accounts hasn't loaded. */
export function resolveChatOrg(state: State): OrgSelection | null {
  if (isUserAccount(state)) return null
  const orgId = selectActiveAccountId(state)
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
})

/* A turn is live while the agent streams or waits on a tool confirmation: no send, no handoff
   between windows until it ends. */
export const selectTurnActive = (state: { chat: IChatState }) =>
  state.chat.streaming || !!state.chat.pendingConfirmation

/* The server transcript in the local shape: tool calls are not replayed, only the text. */
const toTranscript = (messages: Array<{ role: string; content: string }>): ChatTranscriptMessage[] =>
  messages.map(m =>
    m.role === 'assistant' ? { role: 'assistant', text: m.content, toolCalls: [] } : { role: 'user', text: m.content }
  )

const authRequiredError = () =>
  i18n.t('notices:chat.authRequired', {
    defaultValue: 'The agent refused this session\u2019s credentials — refresh permissions to continue.',
  })
const sessionExpiredError = () =>
  i18n.t('notices:chat.sessionExpired', {
    defaultValue: 'The agent lost its authority mid-turn — your session may have been revoked or refreshed. Try again.',
  })

const usageLimitMessage = (e: UsageLimitError): string => {
  const when = formatReset(e.resetsAt)
  return when
    ? i18n.t('notices:chat.usageReset', { defaultValue: '{{msg}} Resets {{when}}.', msg: e.message, when })
    : e.message
}

let abortController: AbortController | null = null
/* The background grant is revoked ONCE per signed-in identity: the id whose revoke this cycle has
   already issued. "Sign out everywhere" revokes it before the AS call (models/auth globalSignOut)
   and the local teardown that follows runs signOut again — without this the second pass issued a
   second enrollment DELETE and could hold the teardown for another bounded wait on a slow agent.
   Keyed by identity rather than a bare flag so a different account is never skipped. Module
   state, like the controller above: it belongs to the process's sign-in cycle, not to persisted
   chat state. Cleared by reset(), which every completed teardown ends with. */
let backgroundRevokedFor: string | null = null
/* The GENERATION of the conversation on screen — the one guard for everything that writes fetched
   chat content into the store. It advances on every event that makes a load already in flight
   unwanted: a history pick (the pick itself takes the new ticket), New Chat, a send (the user has
   committed to what is on screen), and sign-out (nothing this session started may land in the
   next one's store — a slow pick under one account must not write that account's transcript onto
   the next). A load applies only while the ticket it took is still current; the instantaneous
   `streaming` flag is not enough on its own, since a turn can start AND finish while a fetch is
   in flight. (The same check logs.ts keys on requestId.) */
let generation = 0
const nextGeneration = () => ++generation
/* Independent probes — health, the history list, the usage meter — are not scoped to the
   conversation, so they get their own latest-wins tickets instead: an older response that
   lands last must not overwrite a newer one. */
const healthProbe = latestWins()
const listLoad = latestWins()
const usageLoad = latestWins()

export default createModel<RootModel>()({
  state: { ...defaultChatState },
  effects: dispatch => ({
    async send(text: string, state) {
      if (selectTurnActive(state)) return
      // A send commits the user to the conversation on screen: any pick or sync still in flight is
      // no longer wanted — a turn that starts and finishes before it lands would otherwise be
      // replaced (a pick) or removed (a sync) by the stale load.
      nextGeneration()
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
          dispatch.chatLive.append(deltaBuffer)
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
              if (event.type === 'tool_call_start') dispatch.chatLive.toolStart(event)
              else if (event.type === 'tool_call_result') dispatch.chatLive.toolResult(event)
              else if (event.type === 'confirmation_required')
                dispatch.chat.set({
                  pendingConfirmation: { toolUseId: event.id, toolName: event.name, input: event.input },
                })
              else if (event.type === 'done') dispatch.chat.endTurn()
              // The backend prefixes auth failures so the client knows a retry is pointless
              // until the grant is renewed (e.g. it expired mid-turn).
              else if (event.message.startsWith('reauth_required')) {
                dispatch.chat.unauthorized() // mid-stream, not an HTTP 401 — agentRequest cannot see it
                dispatch.chat.endTurn(sessionExpiredError())
              } else dispatch.chat.endTurn(event.message)
            }
          },
        })
      } catch (error) {
        flushDeltas()
        if (error instanceof AgentAuthError) dispatch.chat.set({ error: authRequiredError() })
        else if (error instanceof UsageLimitError) dispatch.chat.endTurn(usageLimitMessage(error))
        else if (error instanceof AgentStreamEndedError)
          // An interruption, not a completion — a cut-off must not leave a truncated reply
          // looking complete with the composer open for another send.
          dispatch.chat.endTurn(
            i18n.t('notices:chat.streamEnded', {
              defaultValue:
                'The connection to the agent closed before it finished — the answer may be incomplete. Try again.',
            })
          )
        else if ((error as Error).name !== 'AbortError') dispatch.chat.endTurn((error as Error).message)
      } finally {
        flushDeltas()
        abortController = null
        // Whatever ended the turn — done, an error, an abort — the reply in flight lands once.
        dispatch.chat.endTurn()
        // A finished turn may have created (and titled) a new conversation — refresh the
        // picker; and the spend just moved, so refresh the usage meter too.
        dispatch.chat.loadConversations()
        dispatch.chat.loadUsage()
      }
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
        dispatch.chat.set({
          pendingConfirmation: pending,
          error: error instanceof AgentAuthError ? authRequiredError() : (error as Error).message,
        })
      }
    },
    async stop(_: void, state) {
      // A pending approval is part of the turn. Abandoning the turn — Stop, New Chat, deleting the
      // open conversation, an identity change, the panel unmounting — DENIES it: the safe answer
      // for a write the user never approved, and the one that lets the server-side turn resolve
      // instead of waiting on a card no window shows any more. (Pop out / Pop back in are GATED
      // while an approval is pending rather than routed here: a handoff means to continue the
      // turn, not abandon it.) Best-effort and not awaited — stopping never waits on the network.
      const { pendingConfirmation, turnId } = state.chat
      if (pendingConfirmation && turnId)
        confirmTool({ turnId, toolUseId: pendingConfirmation.toolUseId, approved: false }).catch(() => {})
      abortController?.abort()
      abortController = null
      // Folded HERE, synchronously: the aborted send's own endTurn runs a microtask later, by which
      // time a New Chat has cleared the conversation — the partial reply would land in the new one.
      dispatch.chat.endTurn()
    },
    /* The turn is over: the reply in flight (models/chatLive) joins the transcript — marked
       Interrupted when an error ended it — and the turn state clears. Safe to repeat: a second
       call finds nothing in flight. */
    async endTurn(error?: string) {
      // The LIVE store, not the invocation snapshot: the reply grew after the effect was dispatched
      const reply = store.getState().chatLive.reply
      if (reply) dispatch.chatLive.clear()
      dispatch.chat.turnEnded({ reply: reply && error !== undefined ? { ...reply, interrupted: true } : reply, error })
    },
    /* Discard the current conversation AND any in-flight turn together. clearConversation is a
       reducer, so it cannot abort the streamChat request on its own: a turn left running would
       keep appending events to the freshly cleared transcript, and the next send would orphan its
       AbortController (Stop then targets only the newer turn, mixing two conversations). New Chat,
       an identity change, and deleting the open conversation all route through here. */
    async newConversation() {
      nextGeneration() // a New Chat outranks any pick or sync still in flight
      await dispatch.chat.stop()
      dispatch.chat.clearConversation()
    },
    /* Move the conversation to its own window; the dock hides when the popout
       says hello. A blocked popup is surfaced instead of silently ignored. */
    async popOut(_: void, state) {
      if (selectTurnActive(state)) return
      // Hand over this window's account scope so the popout boots under it, not the personal
      // account its unset activeId would default to (popoutScopeId explains the stakes). The URL
      // is the ONE carrier: the popout resolves its chat org from that scope exactly as this
      // window does from the sidebar, so the two can never name different orgs.
      if (!openChatPopout(state.accounts.activeId || undefined))
        dispatch.chat.set({
          error: i18n.t('notices:chat.popupBlocked', {
            defaultValue: 'Pop out was blocked — allow popups for this site and try again.',
          }),
        })
    },
    /* The other window's conversation replaces this one: an event that makes every load in flight
       unwanted, so it takes a new generation like a pick or a New Chat does. */
    async adoptHandoff(payload: ChatHandoff) {
      nextGeneration()
      dispatch.chat.adoptTranscript(payload)
    },
    /* Hand the conversation back to the main window and close this popout.
       Reads the handoff after stop() so the final flushed text is included. */
    async popIn(_: void, state) {
      if (selectTurnActive(state)) return
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
      // Latest probe wins: a slow probe started while connectivity was failing must not land after
      // the reconnect-triggered one and flip a fresh `ok` back to `unreachable` — which disabled the
      // composer until the next reopen or network event, with the agent perfectly reachable.
      const isLatest = healthProbe.take()
      const health = await agentHealth()
      if (isLatest()) dispatch.chat.set({ health })
    },
    /* The agent answering "this grant does not cover me" — a 401 on any endpoint, or reauth_required
       mid-stream. A runtime fact, kept where it was seen: the composer shows the refusal and offers
       "Refresh permissions" (auth.healGrant with force — a silent re-authorize). Re-authorizing from
       here would redirect the person mid-turn and lose whatever they were typing, so it does not. */
    async unauthorized(error?: string) {
      dispatch.chat.set({ health: 'unauthorized', ...(error ? { error } : {}) })
    },
    /* The server owns the transcript now (D11) — adopt its copy when it knows more than
       we do, which is exactly how a background turn's result appears after a reopen. */
    async syncTranscript(_: void, state) {
      const id = state.chat.conversationId
      if (!id || state.chat.streaming) return
      // Reads the generation without advancing it: a sync is a background reconcile, not a user
      // action, so it must not out-rank a pick already in flight — but any pick, New Chat, send
      // or sign-out that happens while it waits makes ITS result the stale one.
      const ticket = generation
      try {
        const remote = await fetchConversation(id)
        if (!remote) return
        // The fetch may have outlived the conversation: a New Chat, a history pick, a send or a
        // handoff while it was in flight has advanced the generation, and applying against that
        // snapshot would land the OLD transcript in the new conversation (or repopulate one just
        // cleared). Re-read the LIVE store for the comparison below.
        if (ticket !== generation) return
        const current = store.getState().chat
        const messages = toTranscript(remote.messages)
        // Adopt the server copy when it DIFFERS, not only when it is longer: a popout hands back a
        // partially rendered reply the server then completes to the SAME message count, so a
        // length-only test leaves the partial on screen. Compare the last message's text too. Also
        // apply the server title — a reload restores conversationId but the title defaults to ''.
        const last = messages[messages.length - 1]?.text ?? ''
        const localLast = current.messages[current.messages.length - 1]?.text ?? ''
        const differs = messages.length !== current.messages.length || last !== localLast
        const title = remote.title || current.title
        if (differs) dispatch.chat.set({ messages, title })
        else if (title !== current.title) dispatch.chat.set({ title })
      } catch {
        /* offline, refused or deleted — the local display cache stands */
      }
    },
    /* The chat has no sign-in of its own anymore — it rides the app session
       (permitteer docs/remoteit-ai-agent.md D2). An unauthorized chat while the
       app works means the standing grant predates this build's agent slice, so
       the fix is the grant heal: one silent re-authorize that merges it in. */
    async signIn() {
      // FORCE: this is the person pressing "Refresh permissions" after being told the agent lacks
      // authority. Without it the press reaches healGrant's one-attempt loop-breaker — already
      // spent by the boot heal, which runs first and is the very failure that put this button on
      // screen — and returns silently, leaving a control that does nothing.
      await dispatch.auth.healGrant({ force: true })
      await dispatch.chat.checkHealth()
    },
    /* Reset the chat when the signed-in IDENTITY changes (not an org switch — that keeps your
       account): the conversations, transcript and usage all belong to the permitteer subject the
       agent scopes by, so a persisted chat from a previous account must not carry over (posting
       to it 404s, and its history isn't yours). Same identity → no-op. The caller reloads the
       list and the meter for whoever is signed in (useChatBoot), so a mount never asks twice. */
    async syncIdentity(userId: string, state) {
      if (!userId || state.chat.ownerId === userId) return
      await dispatch.chat.newConversation()
      dispatch.chat.set({ ownerId: userId, conversations: [], usage: null })
    },
    /* The usage meter (docs/usage-limits.md D6) — refreshed on mount, after each turn, and
       on open. Silent on failure; the last-known meter stands. */
    async loadUsage() {
      const isLatest = usageLoad.take()
      const usage = await fetchUsage()
      if (usage && isLatest()) dispatch.chat.set({ usage })
    },
    /* The history picker's list — refreshed when shown, after a turn, and after a delete. */
    async loadConversations() {
      const isLatest = listLoad.take()
      try {
        const conversations = await listConversations()
        if (isLatest()) dispatch.chat.set({ conversations })
      } catch {
        /* offline or refused — leave the last-known list */
      }
    },
    /* Switch the panel to an existing conversation: adopt its server transcript, reset the
       live turn state so nothing from the previous thread bleeds across. */
    async openConversation(id: string, state) {
      if (state.chat.streaming) dispatch.chat.stop()
      // Out-of-order guard: pick A, then B, and A's fetch lands last — A must not replace B. Nor
      // may a New Chat, a send, a sign-out (all of which advance the generation) or a turn still
      // running meanwhile (the composer stays enabled) be clobbered by a load no longer wanted.
      const ticket = nextGeneration()
      const superseded = () => ticket !== generation
      let remote
      try {
        remote = await fetchConversation(id)
      } catch (error) {
        // A service or auth failure is not a deletion: keep the transcript on screen and report,
        // rather than clearing to a new chat as if the conversation had vanished. Unless the
        // user has already moved on — then it is only noise about a thread they left.
        if (superseded()) return
        dispatch.chat.set({ error: error instanceof AgentAuthError ? authRequiredError() : (error as Error).message })
        return
      }
      if (!remote) {
        // Vanished — a genuine 404 (deleted elsewhere). Drop it from the list, and unless the
        // user has already moved on, start fresh.
        await dispatch.chat.loadConversations()
        if (!superseded()) dispatch.chat.clearConversation()
        return
      }
      if (superseded()) return
      dispatch.chat.set({
        conversationId: id,
        turnId: '',
        title: remote.title || '',
        streaming: false,
        pendingConfirmation: null,
        error: null,
        messages: toTranscript(remote.messages),
      })
    },
    /* Delete a conversation for real (D9). If it's the one on screen, clear to a new chat. */
    async removeConversation(id: string) {
      // A failed DELETE (401/403/5xx) is NOT a deletion — the row survives on the server and would
      // reappear on the next refresh. Report it and keep the local copy, rather than clearing the
      // open transcript as though it succeeded. A REJECTED request (network, DNS, CORS — no HTTP
      // response at all) is the same failure and takes the same path: the confirm dialog has
      // already closed, so an unhandled rejection here left the user with no feedback whatsoever.
      let deleted = false
      try {
        deleted = await deleteConversation(id)
      } catch {
        /* a rejected request is the same failure as a refused one */
      }
      if (!deleted) {
        dispatch.chat.set({
          error: i18n.t('notices:chat.deleteFailed', {
            defaultValue: 'Could not delete the conversation — try again.',
          }),
        })
        return
      }
      // The LIVE id, not the invocation snapshot: a slow delete of the open conversation A followed
      // by opening B must not clear B; deleting A from the picker and then opening A before the
      // delete lands must still clear the now-deleted transcript.
      if (store.getState().chat.conversationId === id) await dispatch.chat.newConversation()
      await dispatch.chat.loadConversations()
    },
    /* App sign-out: ends the turn and revokes the background grant (below). The transcript
       reset is dispatched by auth.signedOut alongside the other model resets — dispatching it
       here would land in the purge-to-reload window and re-persist the pre-signout state. */
    async signOut(_: void, state) {
      broadcastChatSignout()
      // Aborting covers the STREAM; the generation covers every other load in flight. Without it a
      // slow history pick started under this account passed its own guard after the reset (its
      // ticket unchanged, nothing streaming) and wrote this account's transcript into the store the
      // NEXT account boots from — persisted, and on the next account's screen if it landed late.
      nextGeneration()
      abortController?.abort()
      abortController = null
      dispatch.chatLive.clear()
      // Explicit sign-out ends the background relationship (plan D8): revoke the agent's stored
      // grant BEFORE the session tokens vanish. AWAITED but BOUNDED — an unawaited revoke raced
      // oidcClearLocal(), so its authenticated DELETE minted no token and background AI access
      // survived sign-out. Awaiting lets the revoke finish while the tokens are still valid; the
      // timeout keeps a slow agent from blocking sign-out. Once per identity (see the marker).
      const who = state?.auth?.user?.id
      if (who && backgroundRevokedFor === who) return
      backgroundRevokedFor = who ?? null
      await withTimeout(
        backgroundDisable().catch(() => {}),
        3000
      )
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
    turnEnded(state: IChatState, end: { reply: ChatAssistantMessage | null; error?: string }) {
      if (end.reply) state.messages.push(end.reply)
      if (end.error !== undefined) state.error = end.error
      state.streaming = false
      state.pendingConfirmation = null
      return state
    },
    // Streaming state must not survive a reload — called when the panel mounts
    resetTransient(state: IChatState) {
      state.streaming = false
      state.pendingConfirmation = null
      state.error = null
      state.health = 'unknown'
      return state
    },
    /* Hand-off: replace the conversation with the other window's copy (adoptHandoff advances the
       generation first — a load in flight for the old conversation must not land on this one). */
    adoptTranscript(state: IChatState, payload: ChatHandoff) {
      state.messages = payload.messages
      state.conversationId = payload.conversationId
      state.title = payload.title
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
      backgroundRevokedFor = null // the next sign-in cycle gets its own revoke
      return { ...defaultChatState }
    },
  },
})
