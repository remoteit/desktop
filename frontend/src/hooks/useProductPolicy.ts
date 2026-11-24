import { useEffect, useState, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccountId, selectRow } from '../selectors/accounts'
import { RowKey } from '../helpers/rowKey'
import { State } from '../store'
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
import { useReadCallback, useReadEffect } from './useReadAgain'
import { accountCache, forgotten, rowNow } from '../services/accountCaches'

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
// before a change cannot land after the read that follows it. Kept by ROW (services/accountCaches): a key is the row
// of the account it was read under — as the sign-in whose row was looked at — and an id. A read is made as the row
// looked at when it is asked: one that answers after another row was picked is not kept, and is read again when its
// row is next looked at.
function shared<T>(load: (id: string, accountId: string) => Promise<T | 'ERROR'>) {
  const answers = new Map<string, T | null>()
  const latest = new Map<string, number>()
  const rowOf = new Map<string, RowKey>()
  const listeners = new Set<() => void>()
  let count = 0

  const keyOf = (row: RowKey, id?: string) => `${row}:${id}`

  const read = async (row: RowKey, id: string, accountId: string) => {
    const key = keyOf(row, id)
    const request = ++count
    latest.set(key, request)
    rowOf.set(key, row)
    const answer = await load(id, accountId)
    if (latest.get(key) !== request) return
    if (rowNow(accountId) !== row) return void latest.delete(key)
    answers.set(key, answer === 'ERROR' ? null : answer)
    listeners.forEach(listener => listener())
  }

  // Read once, by whichever part of the page asks first.
  const first = (row: RowKey, id: string, accountId: string) => {
    if (!latest.has(keyOf(row, id))) read(row, id, accountId)
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
    rowOf.clear()
  }

  // Dropped with its row (services/accountCaches): a read still out then is no longer the latest, and whoever shows
  // it reads again (useReadEffect).
  accountCache((accountIds, rows) => {
    for (const [key, row] of [...rowOf]) {
      if (!forgotten(row, accountIds, rows)) continue
      latest.delete(key)
      answers.delete(key)
      rowOf.delete(key)
    }
    listeners.forEach(listener => listener())
  })

  return { answers, read, first, subscribe, clear, keyOf }
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
  const row = useSelector((state: State) => selectRow(state))
  const key = products.keyOf(row, productId)
  const enabled = !!served?.product && !!productId
  const policy = useSyncExternalStore(products.subscribe, () => (enabled ? products.answers.get(key) : null))

  useReadEffect(() => {
    if (enabled) products.first(row, productId!, accountId)
  }, [enabled, key])

  const reload = useReadCallback(
    () => (enabled ? products.read(row, productId!, accountId) : Promise.resolve()),
    [enabled, key]
  )
  // accountId: the account it was read under, whose catalogue names its apps' releases.
  return { served, policy, reload, accountId }
}

// A device's product: for a device of the account in view (its accountId), a virtual one has none of its own.
export function useDeviceProduct(device?: IDevice) {
  const served = useProductPolicyServed()
  const active = useSelector(selectActiveAccountId)
  const accountId = device?.accountId || active
  const row = useSelector((state: State) => selectRow(state, accountId))
  const deviceId = device && !device.virtual ? device.id : undefined
  const key = devices.keyOf(row, deviceId)
  const enabled = !!served?.device && !!deviceId
  const state = useSyncExternalStore(devices.subscribe, () => (enabled ? devices.answers.get(key) : null))

  useReadEffect(() => {
    if (enabled) devices.first(row, deviceId!, accountId)
  }, [enabled, key])

  const reload = useReadCallback(
    () => (enabled ? devices.read(row, deviceId!, accountId) : Promise.resolve()),
    [enabled, key]
  )
  return { served, state, reload }
}
