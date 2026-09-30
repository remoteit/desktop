import { post } from './post'
import { graphQLGetErrors } from './graphQL'

/* Devices' names in device subnets (graphql's Device.subnetName, <device>.<owner slug>.on.remote.it), for the device
   list's Name column and a device's details. Not in the device list's own query: that query runs on every API, and
   only an API that serves device sessions has the field. So the names are read on their own — batched, one query for
   every row that asks in the same moment, kept for the session — and an API without the field is asked once. */

type Listener = () => void

const names = new Map<string, string | null>()
const listeners = new Set<Listener>()
let wanted = new Set<string>()
let timer: ReturnType<typeof setTimeout> | undefined
let unsupported = false

export const subnetName = (deviceId: string): string | null | undefined => names.get(deviceId)

export function subscribeSubnetNames(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Ask for a device's name: read with every other device asked for before the next tick.
export function requestSubnetName(deviceId: string) {
  if (unsupported || names.has(deviceId) || wanted.has(deviceId)) return
  wanted.add(deviceId)
  timer ??= setTimeout(flush)
}

async function flush() {
  const ids = [...wanted]
  wanted = new Set()
  timer = undefined
  if (!ids.length) return

  const query = `query SubnetNames { login { device(id: ${JSON.stringify(ids)}) { id subnetName } } }`
  const response = await post({ query })
  if (response !== 'ERROR') {
    const errors = graphQLGetErrors(response, true, { query, variables: {} })
    if (errors?.some(error => /Cannot query field/.test(error.message || ''))) unsupported = true
    else if (!errors)
      for (const device of response.data?.data?.login?.device || []) names.set(device.id, device.subnetName ?? null)
  }
  // Asked and not answered (unsupported, an error, not visible): none, so the row stops asking.
  for (const id of ids) if (!names.has(id)) names.set(id, null)
  listeners.forEach(listener => listener())
}

// For tests.
export function resetSubnetNames() {
  names.clear()
  wanted = new Set()
  unsupported = false
  if (timer) clearTimeout(timer)
  timer = undefined
}
