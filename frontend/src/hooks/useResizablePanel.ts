import { useRef, useState, useCallback } from 'react'

interface UseResizablePanelOptions {
  /** Minimum width constraint for the panel */
  minWidth?: number
  /** Maximum width available (e.g., fullWidth - otherPanelWidths) */
  maxWidthConstraint?: number
}

/**
 * Hook to handle drag-to-resize functionality for a panel
 * @param defaultWidth - Initial width of the panel
 * @param options - Configuration options
 * @returns panelRef - ref to attach to the panel element
 * @returns width - current width of the panel
 * @returns grab - whether the user is currently dragging
 * @returns onDown - mouseDown handler for the resize handle
 */
export function useResizablePanel(
  defaultWidth: number,
  containerRef?: React.RefObject<HTMLElement>,
  options: UseResizablePanelOptions = {}
) {
  const { minWidth = 250, maxWidthConstraint } = options

  const panelRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<number>(defaultWidth)
  const moveRef = useRef<number>(0)
  const [width, setWidth] = useState<number>(defaultWidth)
  const [grab, setGrab] = useState<boolean>(false)

  const onMove = useCallback((event: MouseEvent) => {
    const fullWidth = containerRef?.current?.offsetWidth || 1000
    handleRef.current += event.clientX - moveRef.current
    moveRef.current = event.clientX

    const maxConstraint = maxWidthConstraint !== undefined
      ? maxWidthConstraint
      : fullWidth - minWidth

    if (handleRef.current > minWidth && handleRef.current < maxConstraint) {
      setWidth(handleRef.current)
    }
  }, [containerRef, maxWidthConstraint, minWidth])

  const onUp = useCallback((event: MouseEvent) => {
    setGrab(false)
    event.preventDefault()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }, [onMove])

  const onDown = (event: React.MouseEvent) => {
    setGrab(true)
    moveRef.current = event.clientX
    handleRef.current = panelRef.current?.offsetWidth || width
    event.preventDefault()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { panelRef, width, grab, onDown }
}
