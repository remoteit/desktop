import { post } from './post'
import { graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* Proxy and exit groups (graphql-api docs/PROXY-GROUPS.md §11): every proxy and exit is in a group — remote.it's at a
   location, every other an account's own, a group of one made with its first device. A device chooses an exit group
   and remote.it picks the member its traffic goes through. Who may use an own group is its owner's to decide, so a
   group outlives its devices: left with none, it keeps its name, its endpoints and the devices using it as their exit,
   dormant — their traffic going its usual way — until a device in it is in service again, or its account deletes it.
   An own group may be shared with people, to use as their exit, and carries its account's tags: a role scoped by tags
   reaches a group by them, as it reaches a device carrying them. Device-session API only: an API without it answers
   UNSUPPORTED. The words for them are helpers/proxyGroupHelper.ts's. */

export type ProxyGroupMember = {
  id: string
  name: string | null
  kind: 'remoteit' | 'own' | 'exit' // one of remote.it's proxies, an own proxy, or a device offering itself as an exit
  state: string
}

// A person a group is shared with, to use as their exit.
export type ProxyGroupShare = { user: { id: string; email: string | null } }

export type ProxyGroup = {
  label: string
  name: string
  remoteit: boolean
  host: string | null // the name its endpoints are under; none for a group of exits
  members: ProxyGroupMember[] | null // none for one the reader does not manage
  users: number | null // the devices whose exit it is
  endpoints: number | null
  // From an API that shares groups:
  access?: ProxyGroupShare[] // everyone it is shared with, for whoever may see them; your own share, for a sharee
  offered?: boolean // one of its devices in service and offering itself as an exit
  dormant?: boolean // no device in it in service: chosen by no one, its users kept dormant
  owner?: { id: string; email: string | null } | null
  // From an API that tags groups: its account's tags on it, for the account and its organization's members.
  tags?: ITag[]
}

const GROUP_FIELDS = 'label name remoteit host members { id name kind state } users endpoints'
const SHARING_FIELDS = 'access { user { id email } } offered dormant owner { id email }'
const TAG_FIELDS = 'tags { name color created }'

// The fields asked of a group: its sharing and its tags too where the API has them.
const groupFields = async () => {
  const [shares, tags] = await Promise.all([proxyGroupSharesServed(), proxyGroupTagsServed()])
  return [GROUP_FIELDS, shares ? SHARING_FIELDS : '', tags ? TAG_FIELDS : ''].filter(Boolean).join(' ')
}

// A group as read, its tags' dates as dates.
const parsed = (group: ProxyGroup): ProxyGroup =>
  group?.tags
    ? { ...group, tags: group.tags.map(tag => ({ ...tag, created: tag.created ? new Date(tag.created) : undefined })) }
    : group

async function read<T>(query: string, variables: ILookup<any>, marker: string, pick: (data: any) => T) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return pick(response.data?.data)
}

// An account's own groups — those with no device in them too — for whoever manages it.
export const graphQLAccountProxyGroups = async (accountId: string) =>
  read<ProxyGroup[]>(
    `query AccountProxyGroups($accountId: String) { login { id account(id: $accountId) { proxyGroups { ${await groupFields()} } } } }`,
    { accountId },
    'proxyGroups',
    data => (data?.login?.account?.proxyGroups ?? []).map(parsed)
  )

// The groups other accounts share with you, to use as your exit — those not offered now too. An API that shares no
// groups answers UNSUPPORTED.
export const graphQLSharedProxyGroups = () =>
  read<ProxyGroup[]>(
    `query SharedProxyGroups { login { id sharedProxyGroups { label name remoteit host ${SHARING_FIELDS} } } }`,
    {},
    'sharedProxyGroups',
    data => data?.login?.sharedProxyGroups ?? []
  )

// The group a device is in, as a proxy or an exit — with its sharing where the API shares groups; none for one that is
// neither.
export const graphQLDeviceGroup = async (deviceId: string) =>
  read<ProxyGroup | null>(
    `query DeviceGroup($id: [String!]!) { login { device(id: $id) { id group { ${await groupFields()} } } } }`,
    { id: [deviceId] },
    'group',
    data => parsed(data?.login?.device?.[0]?.group ?? null)
  )

// The exit group a device's traffic goes through while Protect is on — its label, whether it is dormant (no device in
// it in service: its traffic goes its usual way until one is), and for whoever manages the group or has it shared, its
// name; none for no exit, or one that is a device. An API before dormancy answers it as not.
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
  const dormant = await read<boolean>(
    `query DeviceExitDormant($id: [String!]!) { login { device(id: $id) { id exitDormant } } }`,
    { id: [deviceId] },
    'exitDormant',
    data => data?.login?.device?.[0]?.exitDormant === true
  )
  return { label, group: group && typeof group === 'object' ? group : null, dormant: dormant === true }
}

// Shares one of your groups with people, by email, to use as their exit; an address with no account gets one. A
// refusal comes back in graphql's words.
export const graphQLShareProxyGroup = (label: string, emails: string[]) =>
  graphQLRequestWithReason(
    ` mutation ShareProxyGroup($group: String!, $email: [String!]!) { shareProxyGroup(group: $group, email: $email) }`,
    { group: label, email: emails }
  )

// Stops sharing a group with people — or, by your own address, leaves one shared with you. Every device whose exit stood
// on such a share alone loses it, and goes its usual way.
export const graphQLUnshareProxyGroup = (label: string, emails: string[]) =>
  graphQLRequestWithReason(
    ` mutation UnshareProxyGroup($group: String!, $email: [String!]!) { unshareProxyGroup(group: $group, email: $email) }`,
    { group: label, email: emails }
  )

// Puts the account's tags on one of its groups, by name — for whoever manages the group; a name the account has no tag
// for is made only for an administrator of the account. A refusal comes back in graphql's words.
export const graphQLAddProxyGroupTag = (label: string, names: string[]) =>
  graphQLRequestWithReason(
    ` mutation AddProxyGroupTag($group: String!, $name: [String!]!) { addProxyGroupTag(group: $group, name: $name) }`,
    { group: label, name: names }
  )

// Takes tags off one of your groups. A device whose exit stood on a role's tags that no longer reach the group loses it,
// and goes its usual way. A refusal comes back in graphql's words.
export const graphQLRemoveProxyGroupTag = (label: string, names: string[]) =>
  graphQLRequestWithReason(
    ` mutation RemoveProxyGroupTag($group: String!, $name: [String!]!) { removeProxyGroupTag(group: $group, name: $name) }`,
    { group: label, name: names }
  )

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

// The API's mutations, asked once of its schema, again after a failed ask: none while unknown.
let mutations: Promise<Set<string> | null> | undefined
function served(name: string): Promise<boolean> {
  if (!mutations)
    mutations = post({ query: `{ mutation: __type(name: "Mutation") { fields { name } } }` }).then(response => {
      if (response === 'ERROR') {
        mutations = undefined
        return null
      }
      return new Set<string>((response.data?.data?.mutation?.fields ?? []).map((f: { name: string }) => f.name))
    })
  return mutations.then(names => !!names?.has(name))
}

// Whether the API has groups an account can list and delete.
export const proxyGroupsServed = () => served('deleteProxyGroup')

// Whether it shares groups, and keeps the users of one with no device in service dormant.
export const proxyGroupSharesServed = () => served('shareProxyGroup')

// Whether it tags groups.
export const proxyGroupTagsServed = () => served('addProxyGroupTag')
