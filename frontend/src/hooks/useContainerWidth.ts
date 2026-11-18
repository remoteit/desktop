import { useRef, useState } from 'react'
import { useResizeMeasure } from './useResizeMeasure'

/**
 * Hook to track the width of a container element using ResizeObserver
 * @returns containerRef - ref to attach to the container element
 * @returns containerWidth - current width of the container
 */
export function useContainerWidth() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(1000)
  useResizeMeasure(containerRef, element => setContainerWidth(element.offsetWidth))
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
  useResizeMeasure(containerRef, element => setNarrow(element.offsetWidth < threshold))
  return { containerRef, narrow }
}
