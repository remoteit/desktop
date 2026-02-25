import React, { useRef, useState, useEffect, useCallback } from 'react'

interface UsePanelDragOptions {
  panelRef: React.RefObject<HTMLDivElement>
  minWidth: number
  getMaxWidth: () => number
  onPersist?: (width: number) => void
  layoutDep?: unknown
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
  const { panelRef, minWidth, getMaxWidth, onPersist, layoutDep } = options

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
      handleRef.current += event.clientX - moveRef.current
      moveRef.current = event.clientX
      if (handleRef.current > minWidth && handleRef.current < maxWidth) {
        setWidth(handleRef.current)
      }
    },
    [minWidth, getMaxWidth]
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
