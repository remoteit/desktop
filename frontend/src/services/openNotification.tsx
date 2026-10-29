import React from 'react'
import { store } from '../store'

export function openNotification(redirect: string, title?: string, body?: string) {
  if (!title) return store.dispatch.ui.set({ redirect })
  const noticeMessage = (
    <>
      <strong>{title}</strong>
      {body && <em>{body}</em>}
    </>
  )
  store.dispatch.ui.set({ redirect, noticeMessage })
}
