import React from 'react'
import { Duration } from '../components/Duration'
import { PENDING_NOTIFICATION_TTL } from '../constants'
import { getLocalStorage, removeLocalStorage, setLocalStorage } from './browser'
import { store } from '../store'

const PENDING = 'pendingNotification'

export type NotificationTap = { title?: string; body?: string; time?: number }

// Stored, not kept in the store, so it survives the webview reload of a mobile sign-in
export function openNotification(url: string, tap: NotificationTap) {
  setLocalStorage(null, PENDING, { ...tap, url, saved: Date.now() })
  store.dispatch.ui.set({ redirect: url })
}

// For the Router as it opens a page: the notice shows with the page it describes, whatever was on screen at the tap
export function showPendingNotice(url?: string): string | undefined {
  const pending = getLocalStorage(null, PENDING)
  if (!pending) return
  const fresh = Date.now() - pending.saved < PENDING_NOTIFICATION_TTL
  if (fresh && url && pending.url !== url) return
  removeLocalStorage(null, PENDING)
  if (!fresh || typeof pending.url !== 'string') return
  const { title, body, time } = pending
  store.dispatch.ui.set({
    noticeMessage: title ? (
      <>
        <strong>{title}</strong>
        {body && <em>{body}</em>}
        {!!time && (
          <em>
            <Duration startTime={time} humanizeOptions={{ largest: 1 }} ago />
          </em>
        )}
      </>
    ) : undefined,
  })
  return pending.url
}
