import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { store, State, Dispatch } from '../store'
import { toChatHandoff } from '../models/chat'
import {
  initChatPopoutMain,
  initChatPopoutWindow,
  checkPopoutPresence,
  PopoutMainHandlers,
  isChatPopout,
  popoutScopeId,
} from '../services/chatPopout'
import network from '../services/Network'

/* Re-probe the agent when the app's own detector says connectivity is back — the same
   'connect' event Heartbeat, CloudSync and Controller reconnect on. Without it an
   outage sticks until the panel is reopened, and the panel is left implying the user
   should go check their own connection. */
const useAgentHealthOnReconnect = (check: () => void): void => {
  useEffect(() => {
    network.on('connect', check)
    return () => {
      network.off('connect', check)
    }
  }, [])
}

const currentHandoff = () => toChatHandoff(store.getState().chat)

/* Popout boot: run under the account scope of the window that opened it. Everything org-scoped
   — App's chat entitlement gate above all — resolves through accounts.activeId, which the
   popout's no-op persistence leaves unset, i.e. the PERSONAL account: a chat licensed only for
   an organization would be refused in its own popout. This must run OUTSIDE that gate
   (ChatWindow's own hooks sit behind it), so App calls it unconditionally; it is a no-op in
   the main window. accounts.parse clears a scope the user is no member of, so a hand-edited
   URL can only ever land back on the personal account. */
export const useChatPopoutScope = (): void => {
  const dispatch = useDispatch<Dispatch>()
  useEffect(() => {
    if (isChatPopout && popoutScopeId) dispatch.accounts.set({ activeId: popoutScopeId })
  }, [])
}

/* Main-window chat lifecycle — everything ChatPanel needs to happen but that
   isn't display: adopting the server's transcript on mount, wiring the popout
   handoff protocol, re-checking agent health when the dock opens, and
   mirroring the app's active org. */
/* The identity the chat is scoped by. auth.user, NOT the persisted `user` model: auth.user is
   fetched for the CURRENT tokens at sign-in (it is what lets App mount), while the user model
   is restored from storage and only catches up when the cloud sync lands. Activating a saved
   account swaps tokens and reloads without purging persisted models, so for that interval
   (indefinitely, if the sync stalls) the user model still names the PREVIOUS account — and an
   ownership check against it would keep that account's transcript on the new account's screen. */
const useChatIdentity = (): string => useSelector((state: State) => state.auth.user?.id ?? '') // '' = not signed in: syncIdentity no-ops

/* What both chat surfaces do on boot: follow the signed-in identity, clear what must not
   survive a reload, and — while SHOWN — catch up with the server. A licensed account with the
   dock closed asks the agent for nothing: no list, no meter, no transcript. */
const useChatBoot = (open: boolean): void => {
  const userId = useChatIdentity()
  const activeId = useSelector((state: State) => state.accounts.activeId)
  const dispatch = useDispatch<Dispatch>()

  // The chat follows the app's active org: the sidebar selector here, the scope it was opened
  // under in the popout (useChatPopoutScope sets it before this runs)
  useEffect(() => {
    dispatch.chat.syncOrg()
  }, [activeId])

  // Declared first so a persisted chat from a previous account is dropped before anything loads
  // it (the identity sync no-ops for the same account, so it is safe to chase on every open). The
  // list, the meter and the server's copy of the transcript follow: once per account per opening.
  useEffect(() => {
    const synced = dispatch.chat.syncIdentity(userId)
    if (!open || !userId) return
    synced.then(() => {
      dispatch.chat.syncTranscript()
      dispatch.chat.loadConversations()
      dispatch.chat.loadUsage()
    })
  }, [open, userId])

  useEffect(() => {
    // Mount-only: streaming state must not survive a reload, but reopening
    // the panel must not reset a still-running stream (closing the panel
    // deliberately leaves the stream running)
    dispatch.chat.resetTransient()
  }, [])

  useAgentHealthOnReconnect(() => dispatch.chat.checkHealth())
}

export const useChatMainSync = (): void => {
  const open = useSelector((state: State) => state.chat.open)
  const dispatch = useDispatch<Dispatch>()
  useChatBoot(open)

  useEffect(() => {
    const handlers: PopoutMainHandlers = {
      getHandoff: currentHandoff,
      adopt: payload => {
        dispatch.chat.adoptHandoff(payload)
        dispatch.chat.set({ poppedOut: false, open: true })
        // The handback carries only the partial response rendered when the popout closed; the
        // server journals the rest of the turn, so pull its copy or the remainder is missing
        // (and the partial looks complete) until a reload.
        dispatch.chat.syncTranscript()
      },
      onPopoutOpened: () => {
        dispatch.chat.stop()
        dispatch.chat.set({ open: false, poppedOut: true })
      },
      // A lost popout leaves no handback at all — reconcile against the server so the dock
      // reopens on the true transcript rather than this window's stale copy.
      onPopoutLost: () => {
        dispatch.chat.set({ poppedOut: false, open: true })
        dispatch.chat.syncTranscript()
      },
      onPresence: present => dispatch.chat.set(present ? { poppedOut: true, open: false } : { poppedOut: false }),
    }
    const unsubscribe = initChatPopoutMain(handlers)
    checkPopoutPresence(handlers)
    return () => {
      unsubscribe()
      // This panel unmounts ONLY when the entitlement goes away — an org switch to an unlicensed
      // account, or the Test feature turned off (closing it merely renders null; popping out
      // stops explicitly). A turn left streaming behind that runs on headless: the remount's
      // resetTransient() then clears streaming/pendingConfirmation while the old request is
      // still live, so the next send orphans its AbortController and two turns' events
      // interleave — and a pending write approval is stranded with no card left to answer it.
      // The turn goes with the panel.
      dispatch.chat.stop()
    }
  }, [])

  useEffect(() => {
    if (open) dispatch.chat.checkHealth()
  }, [open])
}

/* Popout-window chat lifecycle: adopt the handed-off conversation, answer
   liveness pings, and hand the transcript back on unload — keeps ChatWindow
   display-only. */
export const useChatPopoutSync = (): void => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  useChatBoot(true)

  useEffect(() => {
    document.title = t('chat.windowTitle', 'remote.it chat')
    dispatch.chat.checkHealth()
    const unsubscribe = initChatPopoutWindow({
      adopt: payload => dispatch.chat.adoptHandoff(payload),
      getHandoff: currentHandoff,
      onSignout: () => window.close(),
    })
    return () => {
      unsubscribe()
      // Same invariant as the dock: the window's only unmount is App's entitlement gate
      // closing (a window close runs no React cleanup), and a turn must not outlive its surface
      dispatch.chat.stop()
    }
  }, [])
}
