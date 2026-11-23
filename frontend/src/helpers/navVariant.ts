import { useSyncExternalStore } from 'react'

/* Prototype only: which sub-page navigation to show. Set with ?nav=a|a2|b|c|d in the address, kept in localStorage. */
export type NavVariant = 'a' | 'a2' | 'b' | 'c' | 'd'

const VARIANTS: NavVariant[] = ['a', 'a2', 'b', 'c', 'd']
const KEY = 'navVariant'

function read(): NavVariant {
  const asked = window.location.href.match(/[?&]nav=(a2|a|b|c|d)\b/)?.[1] as NavVariant | undefined
  try {
    if (asked) localStorage.setItem(KEY, asked)
    const kept = localStorage.getItem(KEY) as NavVariant | null
    return kept && VARIANTS.includes(kept) ? kept : 'd'
  } catch {
    return asked || 'd'
  }
}

export const NAV_VARIANT: NavVariant = read()
export const sectionPanelVariant = NAV_VARIANT === 'a' || NAV_VARIANT === 'a2'

let sectionHome = false
const listeners = new Set<() => void>()

export function setSectionHome(open: boolean) {
  if (sectionHome === open) return
  sectionHome = open
  listeners.forEach(listener => listener())
}

/* Phone, option A: whether the section's own list of pages is showing instead of a page. */
export function useSectionHome() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => sectionHome
  )
}
