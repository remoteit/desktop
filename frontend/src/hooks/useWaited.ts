import { useEffect, useState } from 'react'

// Whether something has been waited on this long: so that what it holds up is not held for good.
export function useWaited(waiting: boolean, ms: number): boolean {
  const [waited, setWaited] = useState(false)

  useEffect(() => {
    setWaited(false)
    if (!waiting) return
    const timer = setTimeout(() => setWaited(true), ms)
    return () => clearTimeout(timer)
  }, [waiting, ms])

  return waiting && waited
}
