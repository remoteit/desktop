import React, { useRef, useState, useEffect, useCallback } from 'react'
import { subscribeViewport } from './useViewportWidth'

interface UsePanelDragOptions {
  minWidth: number
  getMaxWidth: () => number
  onPersist?: (width: number) => void
  /** Called on every drag frame. Panels whose siblings size themselves from
   *  shared state (the chat column: App reserves its width, DoublePanel sizes
   *  the content from that) must publish the width DURING the drag, or those
   *  siblings keep a stale minWidth, refuse to shrink, and the panel overflows
   *  until mouseup snaps it back. */
  onChange?: (width: number) => void
  layoutDep?: unknown
  /** Which edge the panel is fixed to. A right-anchored panel (the chat
   *  column) grows when the handle is dragged LEFT, so the pointer delta
   *  is inverted. Defaults to left, matching the content panels. */
  anchor?: 'left' | 'right'
}

/**
 * Shared hook for drag-to-resize panel behavior.
 * Used by DoublePanel and TriplePanel to keep resize logic DRY.
 *
 * @param initialWidth - Starting width of the panel
 * @param options.minWidth - Minimum allowed width
 * @param options.getMaxWidth - Callback returning the max allowed width
 * @param options.onPersist - Called on drag end with the final width
 * @param options.layoutDep - Dependency to trigger re-measurement (e.g., layout object)
 */
export function usePanelDrag(initialWidth: number, options: UsePanelDragOptions) {
  const { minWidth, getMaxWidth, onPersist, onChange, layoutDep, anchor = 'left' } = options

  const handleRef = useRef<number>(initialWidth)
  const moveRef = useRef<number>(0)
  const [width, setWidth] = useState<number>(initialWidth)
  const [grab, setGrab] = useState<boolean>(false)

  const measure = useCallback(() => {
    const maxWidth = getMaxWidth()
    if (width < minWidth) setWidth(minWidth)
    else if (width > maxWidth) setWidth(maxWidth)
  }, [width, minWidth, getMaxWidth])

  const onMove = useCallback(
    (event: MouseEvent) => {
      const maxWidth = getMaxWidth()
      const delta = event.clientX - moveRef.current
      moveRef.current = event.clientX
      // CLAMP the accumulator rather than ignoring out-of-range values: letting
      // it run past the limit meant a drag beyond the edge had to retrace the
      // whole overshoot before the panel moved again, which reads as sticking.
      handleRef.current = Math.min(
        Math.max(handleRef.current + (anchor === 'right' ? -delta : delta), minWidth),
        maxWidth
      )
      setWidth(handleRef.current)
      onChange?.(handleRef.current)
    },
    [minWidth, getMaxWidth, anchor, onChange]
  )

  const onUp = useCallback(
    (event: MouseEvent) => {
      setGrab(false)
      event.preventDefault()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      onPersist?.(handleRef.current)
    },
    [onMove, onPersist]
  )

  const onDown = (event: React.MouseEvent) => {
    setGrab(true)
    measure()
    moveRef.current = event.clientX
    /* The accumulator tracks the panel's LOGICAL width, not what it renders as. The
       chat column draws itself an inset narrower than the width it is given, so seeding
       (and persisting) from offsetWidth quietly shaved that inset off every drag — the
       column settled a margin short of its own ceiling and never reached the reading
       measure the ceiling exists to provide. */
    handleRef.current = width
    event.preventDefault()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    setWidth(initialWidth)
  }, [initialWidth])

  // Re-clamp when the layout shifts or the window resizes. The resize is subscribed, not
  // rendered: a frame that leaves the width inside its bounds renders nothing.
  useEffect(() => {
    measure()
  }, [layoutDep, measure])
  const measureRef = useRef(measure)
  measureRef.current = measure
  useEffect(() => subscribeViewport(() => measureRef.current()), [])

  return { width, grab, onDown }
}
