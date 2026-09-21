import { useRef, useState, useEffect } from 'react'

/**
 * Hook to track the width of a container element using ResizeObserver
 * @returns containerRef - ref to attach to the container element
 * @returns containerWidth - current width of the container
 */
export function useContainerWidth() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(1000)
  useContainerObserver(containerRef, setContainerWidth)
  return { containerRef, containerWidth }
}

/**
 * Is the container narrower than `threshold`? Same observer, but the state is the ANSWER,
 * so a list that only wants its cramped/roomy mode re-renders when that flips — not on
 * every frame of a panel drag, window resize or sidebar collapse.
 */
export function useContainerNarrowerThan(threshold: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState<boolean>(false)
  useContainerObserver(containerRef, width => setNarrow(width < threshold))
  return { containerRef, narrow }
}

function useContainerObserver(containerRef: React.RefObject<HTMLDivElement>, onWidth: (width: number) => void) {
  const latest = useRef(onWidth)
  latest.current = onWidth
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) latest.current(containerRef.current.offsetWidth)
    }
    updateWidth()
    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])
}
