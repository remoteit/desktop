import React, { useRef, useState, useEffect, useCallback } from 'react'

interface UsePanelDragOptions {
  panelRef: React.RefObject<HTMLDivElement>
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
 * @param options.panelRef - Ref to the panel DOM element
 * @param options.minWidth - Minimum allowed width
 * @param options.getMaxWidth - Callback returning the max allowed width
 * @param options.onPersist - Called on drag end with the final width
 * @param options.layoutDep - Dependency to trigger re-measurement (e.g., layout object)
 */
export function usePanelDrag(initialWidth: number, options: UsePanelDragOptions) {
  const { panelRef, minWidth, getMaxWidth, onPersist, onChange, layoutDep, anchor = 'left' } = options

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
      handleRef.current = Math.min(Math.max(handleRef.current + (anchor === 'right' ? -delta : delta), minWidth), maxWidth)
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
      onPersist?.(panelRef.current?.offsetWidth || width)
    },
    [onMove, onPersist, panelRef, width]
  )

  const onDown = (event: React.MouseEvent) => {
    setGrab(true)
    measure()
    moveRef.current = event.clientX
    handleRef.current = panelRef.current?.offsetWidth || width
    event.preventDefault()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    setWidth(initialWidth)
  }, [initialWidth])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [layoutDep])

  return { width, grab, onDown }
}
