import { useSyncExternalStore } from 'react'
import { graphQLDeviceRuns, DeviceRuns } from '../services/graphQLDeviceRuns'
import { useDeviceSessions } from './useDeviceSessions'
import { useReadEffect } from './useReadAgain'
import { accountCache } from '../services/accountCaches'

const carried = new Map<string, boolean>()
const asked = new Set<string>()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(listener => listener())
let generation = 0

accountCache(() => {
  carried.clear()
  asked.clear()
  generation++
  notify()
})

export const runsCarry = (runs?: DeviceRuns | null) => !!(runs?.exit || runs?.proxy)

export function setDeviceCarries(deviceId: string, runs?: DeviceRuns | null) {
  carried.set(deviceId, runsCarry(runs))
  notify()
}

async function ask(deviceId: string) {
  if (asked.has(deviceId)) return
  asked.add(deviceId)
  const read = generation
  const runs = await graphQLDeviceRuns(deviceId)
  if (read !== generation) return
  if (runs === 'ERROR') asked.delete(deviceId)
  carried.set(deviceId, typeof runs === 'object' && runsCarry(runs))
  notify()
}

// Whether a device carries an exit or a proxy: undefined while read; false for a virtual device or without device
// sessions, which run neither.
export function useDeviceCarries(device?: Pick<IDevice, 'id' | 'virtual'>): boolean | undefined {
  const deviceSessions = useDeviceSessions()
  const id = deviceSessions && device && !device.virtual ? device.id : undefined
  const value = useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => (id ? carried.get(id) : undefined)
  )
  useReadEffect(() => {
    if (id) ask(id)
  }, [id])
  if (!device) return undefined
  return id ? value : false
}
