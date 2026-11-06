import { useEffect, useState } from 'react'
import { proxyGroupsServed } from '../services/graphQLProxyGroups'

/* Whether the API lists and deletes an account's proxy and exit groups (services/graphQLProxyGroups.ts): undefined
   until asked. */
export function useProxyGroupsServed(): boolean | undefined {
  const [served, setServed] = useState<boolean | undefined>()
  useEffect(() => {
    let live = true
    proxyGroupsServed().then(s => live && setServed(s))
    return () => {
      live = false
    }
  }, [])
  return served
}
