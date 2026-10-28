import { useEffect, useState } from 'react'
import { multiPortServicesOn } from '../services/multiPortServices'

// Whether the account's services take a list of ports (services/multiPortServices): false until it is known.
export function useMultiPortServices(accountId?: string): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    let current = true
    setOn(false)
    multiPortServicesOn(accountId).then(answer => current && setOn(answer))
    return () => {
      current = false
    }
  }, [accountId])
  return on
}
