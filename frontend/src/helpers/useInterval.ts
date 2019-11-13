import { useEffect, useRef } from 'react'

export const useInterval = (callback: () => void, delay?: number, ...args: any[]) => {
  const savedCallback = useRef<Function>()

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current(...args)
      }
    }
    if (delay) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}
