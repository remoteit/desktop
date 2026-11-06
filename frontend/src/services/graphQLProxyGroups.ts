import { post } from './post'
import { graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* Proxy and exit groups (graphql-api docs/PROXY-GROUPS.md §11): every proxy and exit is in a group — remote.it's at a
   location, every other an account's own, a group of one made with its first device. A device chooses an exit group
   and remote.it picks the member its traffic goes through. Who may use an own group is its owner's to decide, so a
   group outlives its devices: left with none, it keeps its name, its endpoints and the devices using it as their exit,
   until its account deletes it. Device-session API only: an API without it answers UNSUPPORTED. The words for them are
   helpers/proxyGroupHelper.ts's. */

export type ProxyGroupMember = {
  id: string
  name: string | null
  kind: 'remoteit' | 'own' | 'exit' // one of remote.it's proxies, an own proxy, or a device offering itself as an exit
  state: string
}

export type ProxyGroup = {
  label: string
  name: string
  remoteit: boolean
  host: string | null // the name its endpoints are under; none for a group of exits
  members: ProxyGroupMember[] | null // none for one the reader does not manage
  users: number | null // the devices whose exit it is
  endpoints: number | null
}

const GROUP_FIELDS = 'label name remoteit host members { id name kind state } users endpoints'

async function read<T>(query: string, variables: ILookup<any>, marker: string, pick: (data: any) => T) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return pick(response.data?.data)
}

// An account's own groups — those with no device in them too — for whoever manages it.
export const graphQLAccountProxyGroups = (accountId: string) =>
  read<ProxyGroup[]>(
    `query AccountProxyGroups($accountId: String) { login { id account(id: $accountId) { proxyGroups { ${GROUP_FIELDS} } } } }`,
    { accountId },
    'proxyGroups',
    data => data?.login?.account?.proxyGroups ?? []
  )

// The group a device is in, as a proxy or an exit; none for one that is neither.
export const graphQLDeviceGroup = (deviceId: string) =>
  read<ProxyGroup | null>(
    `query DeviceGroup($id: [String!]!) { login { device(id: $id) { id group { ${GROUP_FIELDS} } } } }`,
    { id: [deviceId] },
    'group',
    data => data?.login?.device?.[0]?.group ?? null
  )

// The exit group a device's traffic goes through while Protect is on — its label and, for whoever manages the group,
// its name and members; none for no exit, or one that is a device.
export async function graphQLDeviceExitGroup(deviceId: string) {
  const label = await read<string | null>(
    `query DeviceExitGroup($id: [String!]!) { login { device(id: $id) { id exitGroup } } }`,
    { id: [deviceId] },
    'exitGroup',
    data => data?.login?.device?.[0]?.exitGroup ?? null
  )
  if (!label || typeof label !== 'string') return null
  const group = await read<ProxyGroup | null>(
    `query ProxyGroup($group: String!) { proxyGroup(group: $group) { ${GROUP_FIELDS} } }`,
    { group: label },
    'proxyGroup',
    data => data?.proxyGroup ?? null
  )
  return { label, group: group && typeof group === 'object' ? group : null }
}

// Deletes an own group with no device in it. While devices use it as their exit or it has endpoints, graphql refuses it
// unless confirmed: confirmed, their exit ends and the endpoints are removed. A refusal comes back in graphql's words.
export const graphQLDeleteProxyGroup = (label: string, confirm: boolean) =>
  graphQLRequestWithReason(
    ` mutation DeleteProxyGroup($group: String!, $confirm: Boolean) { deleteProxyGroup(group: $group, confirm: $confirm) }`,
    { group: label, confirm }
  )

// Takes a device out of its group: back to a group of one, or — no longer a proxy or an exit — into none.
export const graphQLLeaveProxyGroup = (deviceId: string) =>
  graphQLRequestWithReason(
    ` mutation LeaveProxyGroup($deviceId: String!) { leaveProxyGroup(deviceId: $deviceId) { label } }`,
    { deviceId }
  )

// A refusal's words, from a request made with graphQLRequestWithReason; none for one that went through.
export const refusalOf = (result: Awaited<ReturnType<typeof graphQLRequestWithReason>>): string | undefined =>
  result === 'ERROR' ? '' : 'reason' in result ? result.reason : undefined

// Whether the API has groups an account can list and delete: asked once of its schema, again after a failed ask.
let served: Promise<boolean> | undefined
export function proxyGroupsServed(): Promise<boolean> {
  if (!served)
    served = post({ query: `{ mutation: __type(name: "Mutation") { fields { name } } }` }).then(response => {
      if (response === 'ERROR') {
        served = undefined
        return false
      }
      return !!response.data?.data?.mutation?.fields?.some((f: { name: string }) => f.name === 'deleteProxyGroup')
    })
  return served
}
