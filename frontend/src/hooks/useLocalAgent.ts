import { useEffect } from 'react'
import { followLocalAgent } from '../services/localSubnet'
import { useDeviceSessions } from './useDeviceSessions'

// Whether an agent is here, followed for the whole portal (services/localSubnet): `on` once signed in.
export function useLocalAgent(on: boolean) {
  const deviceSessions = useDeviceSessions()
  useEffect(() => (on && deviceSessions ? followLocalAgent() : undefined), [on, deviceSessions])
}
