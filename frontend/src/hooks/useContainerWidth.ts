import { useRef, useState, useEffect } from 'react'

/**
 * Hook to track the width of a container element using ResizeObserver
 * @returns containerRef - ref to attach to the container element
 * @returns containerWidth - current width of the container
 */
export function useContainerWidth() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(1000)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    
    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => resizeObserver.disconnect()
  }, [])

  return { containerRef, containerWidth }
}
