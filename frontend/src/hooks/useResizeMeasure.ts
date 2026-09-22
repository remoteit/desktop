import { DependencyList, RefObject, useLayoutEffect, useRef } from 'react'

/* Run `measure` against the element now and on every resize of it. Layout-phase, so state
   derived from a size never paints a frame late; the latest `measure` is always the one that
   runs, so callers need not memoise it. */
export function useResizeMeasure<E extends HTMLElement>(
  ref: RefObject<E>,
  measure: (element: E) => void,
  deps: DependencyList = []
) {
  const latest = useRef(measure)
  latest.current = measure
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const run = () => latest.current(element)
    run()
    const observer = new ResizeObserver(run)
    observer.observe(element)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
