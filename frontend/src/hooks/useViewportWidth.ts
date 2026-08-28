import { useSyncExternalStore } from 'react'

/* The window's width, shared by every layout hook and resizable panel.

   One listener for the whole app, coalesced to a frame. Each consumer used to mount its
   OWN resize listener and its own state — and the layout hooks fan out, so a handful of
   components meant a dozen-plus listeners each calling setState on every resize event.
   That cost about a frame's worth of work per event even when the width had not
   changed at all, which is most of what a drag or a maximise actually fires.

   Three things keep it cheap: one listener however many components read it, a burst of
   events collapsed into a single measurement per frame, and silence when the width is
   unchanged — so a no-op resize notifies nobody and renders nothing. */
let width = window.innerWidth
const listeners = new Set<() => void>()
let queued = 0

const measure = () => {
  queued = 0
  const next = window.innerWidth
  if (next === width) return
  width = next
  listeners.forEach(listener => listener())
}

const onResize = () => {
  if (queued) return
  queued = requestAnimationFrame(measure)
}

const subscribe = (listener: () => void) => {
  if (!listeners.size) window.addEventListener('resize', onResize)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size) return
    window.removeEventListener('resize', onResize)
    if (queued) {
      cancelAnimationFrame(queued)
      queued = 0
    }
  }
}

const getSnapshot = () => width

export const useViewportWidth = (): number => useSyncExternalStore(subscribe, getSnapshot)
