import { useEffect, useState } from 'react'
import { useDeviceSessions } from './useDeviceSessions'
import { useDeviceSessionInfo } from './useDeviceSessionInfo'
import {
  LocalSignIn,
  LocalSubnetName,
  localAbsent,
  localSignIn,
  localSubnetName,
  onLocalForgotten,
} from '../services/localSubnet'
import { requestServiceSessionInfo } from '../services/deviceSessionInfo'
import { useReadEffect } from './useReadAgain'

export type SubnetReach = {
  name?: string // the service's name in device subnets, when it has one
  port?: number // the port to use with that name: its usual one where the service has a name of its own
  local?: LocalSubnetName // the name works on this machine (services/localSubnet)
  checked: boolean // asked, and answered: no local means no daemon here reaches it
}

// A device's name in device subnets, or one of its services': undefined with the device-sessions flag off, or none.
// Only the name — whether it works on this machine is useSubnetReach's to ask.
export const useSubnetName = (deviceId?: string, serviceId?: string): string | undefined => {
  const enabled = useDeviceSessions()
  const info = useDeviceSessionInfo(enabled ? deviceId : undefined)
  // A service added since the device was read is not in its answer: read it again for the service's name.
  useReadEffect(() => {
    if (enabled && deviceId && serviceId && info) requestServiceSessionInfo(deviceId, serviceId)
  }, [enabled, deviceId, serviceId, info])
  return enabled ? (serviceId ? info?.services?.[serviceId] : info?.subnetName) ?? undefined : undefined
}

// The port to use with a service's name: its usual one — ssh 22, a web service 443 — where the service has a name of
// its own (presence-server docs/subnet-service-names.md); undefined otherwise, the service's own port.
export const useSubnetPort = (deviceId?: string, serviceId?: string): number | undefined => {
  const enabled = useDeviceSessions()
  const info = useDeviceSessionInfo(enabled ? deviceId : undefined)
  const named = serviceId ? info?.serviceNames?.[serviceId] : undefined
  return (named?.own && named.port) || undefined
}

// A "no" from a daemon that is here may not last — a request that failed answers no too — and nothing else asks again
// while the page is open (a reload did): asked again, anew, after each of these. Not where no daemon is here: that
// waits out its own backoff (services/localSubnet ABSENT_MS).
export const REACH_RETRY_MS = [2_000, 5_000, 10_000, 20_000, 40_000]

// A service's name in device subnets, and whether it works on this machine: through the daemon here when one reaches
// it, or else — once asked and answered — through the browser client (services/browserGateway).
export const useSubnetReach = (deviceId?: string, serviceId?: string): SubnetReach => {
  const name = useSubnetName(deviceId, serviceId)
  const port = useSubnetPort(deviceId, serviceId)
  const id = serviceId || deviceId
  const [reach, setReach] = useState<{ local?: LocalSubnetName; checked: boolean }>({ checked: false })

  useEffect(() => {
    setReach({ checked: false })
    if (!name || !id) return
    let current = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let tries = 0
    const ask = (again?: boolean) => {
      clearTimeout(timer)
      localSubnetName(id, name, again).then(answer => {
        if (!current) return
        setReach({ local: answer ?? undefined, checked: true })
        if (!answer && tries < REACH_RETRY_MS.length && !localAbsent())
          timer = setTimeout(() => ask(true), REACH_RETRY_MS[tries++])
      })
    }
    ask()
    const off = onLocalForgotten(() => {
      tries = 0
      ask()
    })
    return () => {
      current = false
      clearTimeout(timer)
      off()
    }
  }, [id, name])

  return { name, ...(port && { port }), ...reach }
}

// A service's name in device subnets when it works on this machine: undefined otherwise — the device-sessions flag off,
// no name, no daemon here, or one that does not reach it.
export const useLocalSubnetName = (deviceId?: string, serviceId?: string): LocalSubnetName | undefined =>
  useSubnetReach(deviceId, serviceId).local

// Whether the daemon here would serve this person once they sign in on it, and the link that opens its app's sign-in
// (services/localSubnet localSignIn): asked only while `enabled` — Connect has nothing to hand off to it otherwise.
export const useLocalSignIn = (enabled: boolean): LocalSignIn | null => {
  const [signIn, setSignIn] = useState<LocalSignIn | null>(null)

  useEffect(() => {
    setSignIn(null)
    if (!enabled) return
    let current = true
    const ask = () =>
      localSignIn().then(answer => {
        if (current) setSignIn(answer)
      })
    ask()
    const off = onLocalForgotten(ask)
    return () => {
      current = false
      off()
    }
  }, [enabled])

  return signIn
}
