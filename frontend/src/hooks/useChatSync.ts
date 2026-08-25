import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { store, State, Dispatch } from '../store'
import { toChatHandoff } from '../models/chat'
import { initChatPopoutMain, initChatPopoutWindow, checkPopoutPresence, PopoutMainHandlers } from '../services/chatPopout'

const currentHandoff = () => toChatHandoff(store.getState().chat)

/* Main-window chat lifecycle — everything ChatPanel needs to happen but that
   isn't display: completing a Hydra sign-in redirect, wiring the popout
   handoff protocol, re-checking agent health when the dock opens, and
   mirroring the app's active org. */
export const useChatMainSync = (): void => {
  const open = useSelector((state: State) => state.chat.open)
  const activeId = useSelector((state: State) => state.accounts.activeId)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    // Mount-only: streaming state must not survive a reload, but reopening
    // the panel must not reset a still-running stream (closing the panel
    // deliberately leaves the stream running)
    dispatch.chat.resetTransient()
    // Completes a Hydra sign-in redirect if this page load carries ?code —
    // runs on mount regardless of whether the panel is open
    const handlers: PopoutMainHandlers = {
      getHandoff: currentHandoff,
      adopt: payload => {
        dispatch.chat.adoptTranscript(payload)
        dispatch.chat.set({ poppedOut: false, open: true })
      },
      onPopoutOpened: () => {
        dispatch.chat.stop()
        dispatch.chat.set({ open: false, poppedOut: true })
      },
      onPopoutLost: () => dispatch.chat.set({ poppedOut: false, open: true }),
      onPresence: present => dispatch.chat.set(present ? { poppedOut: true, open: false } : { poppedOut: false }),
    }
    const unsubscribe = initChatPopoutMain(handlers)
    checkPopoutPresence(handlers)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (open) dispatch.chat.checkHealth()
  }, [open])

  // The chat follows the app's active org from the sidebar selector
  useEffect(() => {
    dispatch.chat.syncOrg()
  }, [activeId])
}

/* Popout-window chat lifecycle: adopt the handed-off conversation, answer
   liveness pings, and hand the transcript back on unload — keeps ChatWindow
   display-only. */
export const useChatPopoutSync = (): void => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    document.title = t('chat.windowTitle', 'remote.it chat')
    dispatch.chat.resetTransient()
    // No syncOrg here: the popout keeps the org handed off with the
    // conversation (it has no sidebar to change it with)
    dispatch.chat.checkHealth()
    const unsubscribe = initChatPopoutWindow({
      adopt: payload => dispatch.chat.adoptTranscript(payload),
      getHandoff: currentHandoff,
      onSignout: () => window.close(),
    })
    return unsubscribe
  }, [])
}
