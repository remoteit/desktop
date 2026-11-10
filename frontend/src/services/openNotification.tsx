import React from 'react'
import { Duration } from '../components/Duration'
import { getLocalStorage, removeLocalStorage, setLocalStorage } from './browser'
import { store } from '../store'

const PENDING = 'pendingNotification'

export type NotificationTap = { title?: string; body?: string; time?: number }

// Stored, not kept in the store, so it survives the webview reload of a mobile sign-in
export function openNotification(url: string, tap: NotificationTap) {
  setLocalStorage(null, PENDING, { ...tap, url })
  store.dispatch.ui.set({ redirect: url })
}

// For the Router as it opens a page: the notice shows with the page it describes, whatever was on screen at the tap
export function showPendingNotice(url?: string): string | undefined {
  const pending = getLocalStorage(null, PENDING)
  if (!pending || (url && pending.url !== url)) return
  removeLocalStorage(null, PENDING)
  const { title, body, time } = pending
  if (title)
    store.dispatch.ui.set({
      noticeMessage: (
        <>
          <strong>{title}</strong>
          {body && <em>{body}</em>}
          {!!time && (
            <em>
              <Duration startTime={time} humanizeOptions={{ largest: 1 }} ago />
            </em>
          )}
        </>
      ),
    })
  return typeof pending.url === 'string' ? pending.url : undefined
}
