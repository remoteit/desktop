import { post } from './post'
import { graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'
import { ENDPOINT_FIELDS, Endpoint } from './graphQLProxy'
import { noteAccountOf } from '../selectors/signIns'

/* Every public address across the account's services. graphql has no account-wide list of them, so they are read
   through the account's devices: each device's services, and each service's endpoints (Service.endpoints: all of them
   for whoever manages the service, else your own). One request, at most DEVICES_READ devices; total says how many the
   account has, so a larger account can be told its list is partial. */

export const DEVICES_READ = 1000

export type PublicAddress = Endpoint & {
  device: { id: string; name: string }
  service: { id: string; name: string }
}

export type PublicAddresses = { addresses: PublicAddress[]; devices: number; total: number }

type Read = {
  total?: number
  items?: {
    id: string
    name: string
    services?: { id: string; name: string; endpoints?: Endpoint[] | null }[] | null
  }[]
}

export function publicAddressesOf(read: Read | null | undefined): PublicAddresses {
  const items = read?.items ?? []
  const addresses: PublicAddress[] = []
  for (const device of items)
    for (const service of device.services ?? [])
      for (const endpoint of service.endpoints ?? [])
        addresses.push({
          ...endpoint,
          device: { id: device.id, name: device.name },
          service: { id: service.id, name: service.name },
        })
  addresses.sort(
    (a, b) =>
      a.device.name.localeCompare(b.device.name) ||
      a.service.name.localeCompare(b.service.name) ||
      a.created.localeCompare(b.created)
  )
  return { addresses, devices: items.length, total: read?.total ?? items.length }
}

export async function graphQLPublicAddresses(accountId?: string) {
  const query = `query PublicAddresses($accountId: String, $size: Int) {
    login { id account(id: $accountId) { devices(size: $size, from: 0) {
      total items { id name services { id name endpoints { ${ENDPOINT_FIELDS} } } }
    } } }
  }`
  const variables = { accountId, size: DEVICES_READ }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, 'endpoints')) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  const read = publicAddressesOf(response.data?.data?.login?.account?.devices)
  noteAccountOf(
    accountId,
    read.addresses.flatMap(address => [address.id, address.service.id, address.device.id])
  )
  return read
}

export type ServiceChoice = { id: string; name: string; device: { id: string; name: string }; manage: boolean }

// The account's services a public address can be made for, by device: those you may connect to.
export async function graphQLServiceChoices(accountId?: string) {
  const query = `query PublicAddressServices($accountId: String, $size: Int) {
    login { id account(id: $accountId) { devices(size: $size, from: 0) { items { id name permissions services { id name } } } } }
  }`
  const variables = { accountId, size: DEVICES_READ }
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  if (graphQLGetErrors(response, true, { query, variables })) return 'ERROR' as const
  const items: { id: string; name: string; permissions?: string[]; services?: { id: string; name: string }[] }[] =
    response.data?.data?.login?.account?.devices?.items ?? []
  noteAccountOf(
    accountId,
    items.flatMap(device => [device.id, ...(device.services ?? []).map(service => service.id)])
  )
  return items.flatMap(device =>
    (device.services ?? []).map<ServiceChoice>(service => ({
      id: service.id,
      name: service.name,
      device: { id: device.id, name: device.name },
      manage: !!device.permissions?.includes('MANAGE'),
    }))
  )
}
