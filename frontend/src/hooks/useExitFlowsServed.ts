import { useEffect, useState } from 'react'
import { exitFlowsServed } from '../services/exitFlows'

// Whether the API has exitFlows (services/exitFlows.ts): false until the schema says so, read once — skipped while off.
export function useExitFlowsServed(on = true): boolean {
  const [served, setServed] = useState(false)
  useEffect(() => {
    if (!on) return
    let current = true
    exitFlowsServed().then(answer => current && setServed(answer))
    return () => {
      current = false
    }
  }, [on])
  return on && served
}
