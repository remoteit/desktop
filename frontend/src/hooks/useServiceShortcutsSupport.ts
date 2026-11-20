import { useEffect, useState } from 'react'
import { serviceShortcutsSupport } from '../services/graphQLServiceShortcuts'

export function useServiceShortcutsSupport(on = true, retry = 0) {
  const [support, setSupport] = useState<Awaited<ReturnType<typeof serviceShortcutsSupport>>>()

  useEffect(() => {
    if (!on) return
    let current = true
    serviceShortcutsSupport().then(support => {
      if (current) setSupport(support)
    })
    return () => {
      current = false
    }
  }, [on, retry])

  return on ? support : undefined
}
