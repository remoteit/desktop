import React from 'react'
import { Duration } from '../components/Duration'
import { store } from '../store'

export type NotificationTap = { title?: string; body?: string; time?: number }

export function openNotification(redirect: string, tap: NotificationTap) {
  store.dispatch.ui.set({ redirect, ...notice(tap) })
}

export function restoreNotice(saved: string) {
  try {
    store.dispatch.ui.set(notice(JSON.parse(saved)))
  } catch (error) {
    console.warn('NOTICE RESTORE FAILED', error)
  }
}

function notice({ title, body, time }: NotificationTap) {
  if (!title) return {}
  return {
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
  }
}
