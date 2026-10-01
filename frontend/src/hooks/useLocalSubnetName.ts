import { useEffect, useState } from 'react'
import { useDeviceSessions } from './useDeviceSessions'
import { useDeviceSessionInfo } from './useDeviceSessionInfo'
import { LocalSubnetName, localSubnetName } from '../services/localSubnet'

// A service's name in device subnets when it works on this machine (services/localSubnet): undefined otherwise — the
// device-sessions flag off, no name, no daemon here, or one that does not reach it.
export const useLocalSubnetName = (deviceId?: string, serviceId?: string): LocalSubnetName | undefined => {
  const enabled = useDeviceSessions()
  const info = useDeviceSessionInfo(enabled ? deviceId : undefined)
  const name = serviceId ? info?.services?.[serviceId] : info?.subnetName
  const [local, setLocal] = useState<LocalSubnetName>()

  useEffect(() => {
    setLocal(undefined)
    if (!enabled || !name) return
    let current = true
    localSubnetName(name).then(answer => {
      if (current && answer) setLocal(answer)
    })
    return () => {
      current = false
    }
  }, [enabled, name])

  return local
}
