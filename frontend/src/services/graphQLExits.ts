import { post } from './post'
import { graphQLGetErrors, graphQLRequestWithReason } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'
import { EXIT_DEVICE_FIELDS, ExitDevice } from './graphQLDeviceRuns'

/* Exits (graphql-api docs/PROXY-GROUPS.md §13): what devices send their traffic out through, run by devices — remote.it
   picks the one a device's new connections go through. remote.it's are at a location and offered by plan; an own exit
   is its account's: made, then devices added to run it, and kept — its users and all — until its account deletes it.
   With no device carrying its flows — serving, not disabled, and offering itself — it is dormant: no device may choose
   it, and those using it go their usual way until one carries them again.
   An own exit is shared with people, tagged with its account's tags, and offered on networks. Whether its users reach
   its devices' local networks is the exit's setting (Exit.lan): users choose an exit, not the device carrying their
   flows, so their reach stays as the cloud moves them. Each device takes it as it joins, and its machine's
   administrator keeps the last word (ExitDevice.lanReason). A device's exit is the one it uses (Device.usesExit), apart
   from the one it runs (Device.runs). A refusal comes back in graphql's words. Device-session API only: an API without
   it answers UNSUPPORTED. */

export type UserRef = { id: string; email: string | null }

export type ExitShare = { user: UserRef; sharedBy: { email: string | null } | null; created: string }

// Why an exit is offered: OWN, its account is yours; SHARED, shared with you; ROLE, your role in its account reaches it;
// NETWORK, a network the device initiates on makes it available; PLAN, remote.it's, by the plan.
export type ExitReason = 'OWN' | 'SHARED' | 'ROLE' | 'NETWORK' | 'PLAN'

export type Exit = {
  id: string // its label: what a device's exit names, never changed
  name: string
  remoteit: boolean
  location: string | null
  provider: string
  activation: 'auto' | 'admin'
  manage: boolean
  offered: boolean // one of its devices carrying its flows: serving, not disabled, and offering itself
  dormant: boolean // an own exit with no device carrying its flows
  lan: boolean // its users reach its devices' local networks; never remote.it's
  // Why you may not open its devices' networks: it is remote.it's, or a device of it is not yours to manage (named).
  // None where you may. Closing them needs only managing it.
  lanRefusal: string | null
  owner: UserRef | null // none for one of remote.it's
  devices: ExitDevice[] | null // for whoever manages it
  users: number | null // the devices using it, for whoever manages it
  access: ExitShare[] // everyone, for whoever may share it; your own share, for someone it is shared with
  tags: ITag[] // for its account and its organization's members
  networks: { id: string; name: string }[] | null // for whoever manages it
  products?: { id: string; name: string }[] // the products whose new devices join it; remote.it's admin page's
}

// Every field but the networks: what a list shows of each.
const FIELDS = `id name remoteit location provider activation manage offered dormant lan lanRefusal users
  owner { id email } devices { ${EXIT_DEVICE_FIELDS} } access { user { id email } sharedBy { email } created }
  tags { name color created }`

// An exit as read, its tags' dates as dates.
const parsed = (exit: Exit): Exit =>
  exit?.tags ? { ...exit, tags: exit.tags.map(tag => ({ ...tag, created: tag.created && new Date(tag.created) })) } : exit

async function read<T>(query: string, variables: ILookup<any>, marker: string, pick: (data: any) => T) {
  const response = await post({ query, variables })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables })
  if (withoutDeviceSessions(errors, marker)) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return pick(response.data?.data)
}

// An account's own exits you manage — those no device runs too — and those other accounts share with it.
export const graphQLAccountExits = (accountId: string) =>
  read<{ own: Exit[]; shared: Exit[] }>(
    `query AccountExits($accountId: String) {
      login { id account(id: $accountId) { id exits { ${FIELDS} } sharedExits { ${FIELDS} } } }
    }`,
    { accountId },
    'exits',
    data => ({
      own: (data?.login?.account?.exits ?? []).map(parsed),
      shared: (data?.login?.account?.sharedExits ?? []).map(parsed),
    })
  )

// The exits you may send a device's traffic through, offered now — remote.it's by plan, your own, those shared with you,
// those your role reaches — and, with a device you manage, those it may use as itself: its networks', and remote.it's
// by its account's plan — each with why it is offered. Never the exit the device runs.
export type OfferedExit = Pick<Exit, 'id' | 'name' | 'remoteit' | 'location' | 'provider' | 'owner'> & {
  reasons: ExitReason[] | null
}

export const graphQLOfferedExits = (deviceId?: string) =>
  read<OfferedExit[]>(
    `query OfferedExits($deviceId: String) {
      exits(deviceId: $deviceId) { id name remoteit location provider owner { id email } reasons }
    }`,
    { deviceId },
    'exits',
    data => data?.exits ?? []
  )

// One exit, with the networks it is offered on: one you manage, or one you see — shared with you, or reached by your
// role. None for one you may not see.
export const graphQLExit = (id: string) =>
  read<Exit | null>(
    `query Exit($id: String!) { exit(id: $id) { ${FIELDS} networks { id name } } }`,
    { id },
    'exit',
    data => (data?.exit ? parsed(data.exit) : null)
  )

// Made in your account, or one you manage: then devices are added to run it.
export async function graphQLCreateExit(name: string, accountId?: string): Promise<Exit | { reason: string }> {
  const result = await graphQLRequestWithReason(
    ` mutation CreateExit($name: String!, $accountId: String) { createExit(name: $name, accountId: $accountId) { ${FIELDS} } }`,
    { name, accountId }
  )
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return parsed(result.data?.data?.createExit)
}

export const graphQLRenameExit = (exit: string, name: string) =>
  graphQLRequestWithReason(` mutation RenameExit($exit: String!, $name: String!) { renameExit(exit: $exit, name: $name) { id } }`, {
    exit,
    name,
  })

// How its new devices go into service: auto, by themselves once their checks pass; admin, when an admin puts them in.
export const graphQLSetExitActivation = (exit: string, activation: 'auto' | 'admin') =>
  graphQLRequestWithReason(
    ` mutation SetExitActivation($exit: String!, $activation: String!) { setExitActivation(exit: $exit, activation: $activation) { id } }`,
    { exit, activation }
  )

// A product whose new devices join it (graphql-api docs/PROXY-GROUPS.md §11 wave 2): each device the product registers
// is added as addExitDevice adds one, and goes into service as its activation says. Removed, the product adds no device
// more and takes none out. A refusal in graphql's words.
export const graphQLSetExitProduct = (exit: string, productId: string, joined: boolean) =>
  graphQLRequestWithReason(
    joined
      ? ` mutation AddExitProduct($exit: String!, $productId: ID!) {
          addExitProduct(exit: $exit, productId: $productId) { id }
        }`
      : ` mutation RemoveExitProduct($exit: String!, $productId: ID!) {
          removeExitProduct(exit: $exit, productId: $productId) { id }
        }`,
    { exit, productId }
  )

// Whether its users reach its devices' local networks: each device it runs on takes it at once, and each added later as
// it joins — a machine whose administrator keeps its exit node local stays as set there. Opening is refused for
// remote.it's and for one with a device you do not manage (Exit.lanRefusal says so first); closing needs only managing
// it. A refusal comes back in graphql's words.
export const graphQLSetExitLan = (exit: string, lan: boolean) =>
  graphQLRequestWithReason(` mutation SetExitLan($exit: String!, $lan: Boolean!) { setExitLan(exit: $exit, lan: $lan) { id } }`, {
    exit,
    lan,
  })

// One no device runs. While devices use it, refused unless confirmed: confirmed, their exit ends and its shares go.
export const graphQLDeleteExit = (exit: string, confirm: boolean) =>
  graphQLRequestWithReason(
    ` mutation DeleteExit($exit: String!, $confirm: Boolean) { deleteExit(exit: $exit, confirm: $confirm) }`,
    { exit, confirm }
  )

// The users of an exit no device runs, to another of its account's with a device in service: what it would do, and,
// applied, done.
export async function graphQLMoveExitUsers(
  from: string,
  to: string,
  apply: boolean
): Promise<{ users: number; applied: boolean } | { reason: string }> {
  const result = await graphQLRequestWithReason(
    ` mutation MoveExitUsers($from: String!, $to: String!, $apply: Boolean) {
      moveExitUsers(from: $from, to: $to, apply: $apply) { users applied }
    }`,
    { from, to, apply }
  )
  if (result === 'ERROR') return { reason: '' }
  if ('reason' in result) return result
  return result.data?.data?.moveExitUsers ?? { reason: '' }
}

// The account's tags, put on or taken off by name; a new one is made for an administrator of the account alone.
export const graphQLAddExitTag = (exit: string, names: string[]) =>
  graphQLRequestWithReason(` mutation AddExitTag($exit: String!, $name: [String!]!) { addExitTag(exit: $exit, name: $name) }`, {
    exit,
    name: names,
  })

export const graphQLRemoveExitTag = (exit: string, names: string[]) =>
  graphQLRequestWithReason(
    ` mutation RemoveExitTag($exit: String!, $name: [String!]!) { removeExitTag(exit: $exit, name: $name) }`,
    { exit, name: names }
  )

// Shared with people, by email, to use as their exit — an address with no account gets one — or no longer. A device
// whose exit stood on such a share alone loses it, and goes its usual way.
export const graphQLShareExit = (exit: string, emails: string[]) =>
  graphQLRequestWithReason(` mutation ShareExit($exit: String!, $email: [String!]!) { shareExit(exit: $exit, email: $email) }`, {
    exit,
    email: emails,
  })

export const graphQLUnshareExit = (exit: string, emails: string[]) =>
  graphQLRequestWithReason(
    ` mutation UnshareExit($exit: String!, $email: [String!]!) { unshareExit(exit: $exit, email: $email) }`,
    { exit, email: emails }
  )

// An exit shared with you, left: a device of yours using it goes its usual way.
export const graphQLLeaveExitShare = (exit: string) =>
  graphQLRequestWithReason(` mutation LeaveExitShare($exit: String!) { leaveExitShare(exit: $exit) }`, { exit })

// One of your exits made available on a network you manage — or no longer, from the network's side or the exit's.
export const graphQLSetNetworkExit = (networkId: string, exit: string, available: boolean) =>
  graphQLRequestWithReason(
    ` mutation SetNetworkExit($networkId: String!, $exit: String!, $available: Boolean!) {
      setNetworkExit(networkId: $networkId, exit: $exit, available: $available)
    }`,
    { networkId, exit, available }
  )

// Each of the account's networks' exits, by network. Asked apart from the networks, so an API without them still shows
// the networks: it answers UNSUPPORTED.
export type NetworkExit = Pick<Exit, 'id' | 'name' | 'remoteit' | 'offered' | 'dormant' | 'owner'>

export async function graphQLNetworkExits(
  accountId?: string
): Promise<Map<string, NetworkExit[]> | 'ERROR' | typeof UNSUPPORTED> {
  const result = await read<{ id: string; exits?: NetworkExit[] }[]>(
    `query NetworkExits($accountId: String) {
      login { account(id: $accountId) { networks { id exits { id name remoteit offered dormant owner { id email } } } } }
    }`,
    { accountId },
    'exits',
    data => data?.login?.account?.networks ?? []
  )
  if (!Array.isArray(result)) return result
  return new Map(result.map(network => [network.id, network.exits ?? []]))
}

/* A device's exit: the one its traffic goes out through while Protect is on — dormant while no device of it is in
   service, its traffic going its usual way until one is —, the device of it its new connections go through now, who
   chose it — on the device (the OS user there) or in the portal — and what the machine's administrator decided of it
   there (device-package docs/menu-app.md §3): who may choose it (cloud+local, local, never), the exits allowed (null:
   every one), the exit pinned. Read apart from Protect, so an API before its field still shows the exit. */
export type DeviceExit = {
  usesExit: Pick<Exit, 'id' | 'name' | 'remoteit' | 'owner' | 'offered' | 'dormant'> | null
  usesExitThrough: { id: string; name: string } | null
  exitDormant: boolean | null
  exitSetOnDevice: boolean | null
  exitSetOnDeviceBy: string | null
  exitSetBy: { email: string | null } | null
  exitPolicy: 'cloud+local' | 'local' | 'never' | null
  exitAllowed: string[] | null
  exitPinned: string | null
}

export const graphQLDeviceExit = (deviceId: string) =>
  read<DeviceExit | null>(
    `query DeviceExit($id: [String!]!) {
      login { device(id: $id) { id usesExit { id name remoteit owner { id email } offered dormant }
        usesExitThrough { id name } exitDormant exitSetOnDevice exitSetOnDeviceBy exitSetBy { email } exitPolicy
        exitAllowed exitPinned } }
    }`,
    { id: [deviceId] },
    'usesExit',
    data => data?.login?.device?.[0] ?? null
  )

// remote.it Protect on a device, as its engine keeps it (connectd's about.protect): on or off, and the exit it routes
// through — said while Protect is off too, which the device's exit (none then) cannot say. Turning it on from here is
// choosing that exit as the device's exit: either side sets, the newer stands.
export type ProtectInfo = { on: boolean | null; route: string | null; routeName: string | null }

export const graphQLDeviceProtect = (deviceId: string) =>
  read<ProtectInfo | null>(
    `query DeviceProtect($id: [String!]!) { login { device(id: $id) { id about { protect { on route routeName } } } } }`,
    { id: [deviceId] },
    'protect',
    data => data?.login?.device?.[0]?.about?.protect ?? null
  )

// A device's traffic sent out through an exit — its exit, and Protect on — or none: Protect off, the exit kept for when
// it is on again. Never the exit it runs; an exit with no device in service is refused.
export const graphQLSetDeviceExit = (deviceId: string, via: string | null) =>
  graphQLRequestWithReason(
    ` mutation SetDeviceExit($deviceId: String!, $via: String) { setDeviceExit(deviceId: $deviceId, via: $via) }`,
    { deviceId, via }
  )
