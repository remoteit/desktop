import { useSyncExternalStore } from 'react'

export type NavStyle = 'a' | 'b' | 'b2' | 'b3' | 'c' | 'c2' | 'd' | 'e'

export const NAV_STYLES: { id: NavStyle; label: string }[] = [
  { id: 'a', label: 'Box' },
  { id: 'b', label: 'Callout' },
  { id: 'b2', label: 'Darker' },
  { id: 'b3', label: 'Lighter' },
  { id: 'c', label: 'Rules' },
  { id: 'c2', label: 'Caret' },
  { id: 'd', label: 'Quiet' },
  { id: 'e', label: 'Bar' },
]

const KEY = 'navstyle'
const HIDDEN_KEY = 'navstyle-picker-hidden'
const isStyle = (value: string | null): value is NavStyle => NAV_STYLES.some(style => style.id === value)

const load = (key: string) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const save = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {}
}

function initial(): NavStyle {
  const query = window.location.search + '&' + (window.location.hash.split('?')[1] || '')
  const asked = new URLSearchParams(query).get(KEY)
  if (isStyle(asked)) {
    save(KEY, asked)
    return asked
  }
  const kept = load(KEY)
  return isStyle(kept) ? kept : 'a'
}

let state = { style: initial(), hidden: load(HIDDEN_KEY) === 'true' }
const listeners = new Set<() => void>()

const update = (next: Partial<typeof state>) => {
  state = { ...state, ...next }
  listeners.forEach(listener => listener())
}

export const setNavStyle = (style: NavStyle) => {
  save(KEY, style)
  update({ style })
}

export const setNavStylePickerHidden = (hidden: boolean) => {
  save(HIDDEN_KEY, String(hidden))
  update({ hidden })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useNavStyle = () => useSyncExternalStore(subscribe, () => state)
