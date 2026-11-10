import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId } from '../selectors/accounts'
import { useDeviceSessions } from './useDeviceSessions'
import {
  DeviceProductState,
  NOTHING_SERVED,
  ProductPolicy,
  ProductPolicyServed,
  graphQLDeviceProduct,
  graphQLProductPolicy,
  productPolicyServed,
} from '../services/productPolicy'

/* Product policy's reads (services/productPolicy), behind the device-sessions gate as the rest of Control Link is: what
   the API serves of it, a product's policy, and a device's product. A product's and a device's are shared by every part
   of a page that shows them, read when first asked for and again after a change (reload); undefined while read, null
   where they cannot be. */

// What the API serves; undefined while it is read, and nothing with the gate off.
export function useProductPolicyServed(): ProductPolicyServed | undefined {
  const enabled = useDeviceSessions()
  const [served, setServed] = useState<ProductPolicyServed>()

  useEffect(() => {
    if (!enabled) {
      setServed(undefined)
      return
    }
    let current = true
    productPolicyServed().then(answer => current && setServed(answer))
    return () => {
      current = false
    }
  }, [enabled])

  return enabled ? served : NOTHING_SERVED
}

// A shared read: each key's answer, its listeners told when it changes. The latest read of a key wins: one started
// before a change cannot land after the read that follows it.
function shared<T>(load: (...args: string[]) => Promise<T | 'ERROR'>) {
  const answers = new Map<string, T | null>()
  const latest = new Map<string, number>()
  const listeners = new Set<() => void>()
  let count = 0

  const read = async (key: string, ...args: string[]) => {
    const request = ++count
    latest.set(key, request)
    const answer = await load(...args)
    if (latest.get(key) !== request) return
    answers.set(key, answer === 'ERROR' ? null : answer)
    listeners.forEach(listener => listener())
  }

  // Read once, by whichever part of the page asks first.
  const first = (key: string, ...args: string[]) => {
    if (!latest.has(key)) read(key, ...args)
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const clear = () => {
    answers.clear()
    latest.clear()
  }

  return { answers, read, first, subscribe, clear }
}

const products = shared<ProductPolicy>((productId, accountId) => graphQLProductPolicy(productId, accountId))
const devices = shared<DeviceProductState>((deviceId, accountId) => graphQLDeviceProduct(deviceId, accountId))

// For tests, and for a change of sign-in.
export function resetProductPolicyReads() {
  products.clear()
  devices.clear()
}

export function useProductPolicy(productId?: string) {
  const served = useProductPolicyServed()
  const accountId = useSelector(selectActiveAccountId)
  const key = `${accountId}:${productId}`
  const enabled = !!served?.product && !!productId
  const policy = useSyncExternalStore(products.subscribe, () => (enabled ? products.answers.get(key) : null))

  useEffect(() => {
    if (enabled) products.first(key, productId!, accountId)
  }, [enabled, key])

  const reload = useCallback(
    () => (enabled ? products.read(key, productId!, accountId) : Promise.resolve()),
    [enabled, key]
  )
  return { served, policy, reload }
}

// A device's product: for a device of the account in view (its accountId), a virtual one has none of its own.
export function useDeviceProduct(device?: IDevice) {
  const served = useProductPolicyServed()
  const active = useSelector(selectActiveAccountId)
  const accountId = device?.accountId || active
  const deviceId = device && !device.virtual ? device.id : undefined
  const key = `${accountId}:${deviceId}`
  const enabled = !!served?.device && !!deviceId
  const state = useSyncExternalStore(devices.subscribe, () => (enabled ? devices.answers.get(key) : null))

  useEffect(() => {
    if (enabled) devices.first(key, deviceId!, accountId)
  }, [enabled, key])

  const reload = useCallback(
    () => (enabled ? devices.read(key, deviceId!, accountId) : Promise.resolve()),
    [enabled, key]
  )
  return { served, state, reload }
}
