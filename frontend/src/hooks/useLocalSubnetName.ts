import { useEffect, useState } from 'react'
import { useDeviceSessions } from './useDeviceSessions'
import { useDeviceSessionInfo } from './useDeviceSessionInfo'
import { LocalSubnetName, localSubnetName } from '../services/localSubnet'

export type SubnetReach = {
  name?: string // the service's name in device subnets, when it has one
  local?: LocalSubnetName // the name works on this machine (services/localSubnet)
  checked: boolean // asked, and answered: no local means no daemon here reaches it
}

// A service's name in device subnets, and whether it works on this machine: through the daemon here when one reaches
// it, or else — once asked and answered — through the browser client (services/browserGateway).
export const useSubnetReach = (deviceId?: string, serviceId?: string): SubnetReach => {
  const enabled = useDeviceSessions()
  const info = useDeviceSessionInfo(enabled ? deviceId : undefined)
  const name = enabled ? (serviceId ? info?.services?.[serviceId] : info?.subnetName) ?? undefined : undefined
  const id = serviceId || deviceId
  const [reach, setReach] = useState<{ local?: LocalSubnetName; checked: boolean }>({ checked: false })

  useEffect(() => {
    setReach({ checked: false })
    if (!name || !id) return
    let current = true
    localSubnetName(id, name).then(answer => {
      if (current) setReach({ local: answer ?? undefined, checked: true })
    })
    return () => {
      current = false
    }
  }, [id, name])

  return { name, ...reach }
}

// A service's name in device subnets when it works on this machine: undefined otherwise — the device-sessions flag off,
// no name, no daemon here, or one that does not reach it.
export const useLocalSubnetName = (deviceId?: string, serviceId?: string): LocalSubnetName | undefined =>
  useSubnetReach(deviceId, serviceId).local
