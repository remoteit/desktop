import type { TFunction } from 'i18next'
import type { ProxyGroup } from '../services/graphQLProxyGroups'

/* Proxy and exit groups, as the portal says them (graphql-api docs/PROXY-GROUPS.md §11, "Who may use an own group, and
   empty groups", "Sharing an own group", "Empty groups are not offered; their users are dormant"): who uses a group and
   what it has, who it is shared with, and what taking away its last device — keeping the group, or deleting it too —
   does to them. A group with no device in service is dormant: no device may choose it, and those using it go their
   usual way until one is in service again. */

// A device's group as the API answered it: the group, none (the device is in none), or unknown (an API without groups,
// or a read that failed) — where nothing is said of a group.
export const groupOrNone = (answer: unknown): ProxyGroup | null | undefined =>
  answer && typeof answer === 'object' ? (answer as ProxyGroup) : answer === null ? null : undefined

// Whether the device is all that is left in its group: taking it away leaves the group with no device.
export const lastInGroup = (group: ProxyGroup | null | undefined, deviceId: string) =>
  !!group?.members && group.members.length === 1 && group.members[0].id.toUpperCase() === deviceId.toUpperCase()

// Whether a group has no device in it: kept, its endpoints and users with it, until it is deleted.
export const emptyGroup = (group: ProxyGroup) => !!group.members && !group.members.length

// Whether deleting a group needs graphql's confirm: it ends some device's exit, or removes endpoints.
export const deletingTakesAway = (group: Pick<ProxyGroup, 'users' | 'endpoints'>) => !!group.users || !!group.endpoints

// A group's use, in words: the devices using it as their exit, and its endpoints.
export function groupUse(t: TFunction, group: Pick<ProxyGroup, 'users' | 'endpoints'>): string {
  const users = group.users ?? 0
  const endpoints = group.endpoints ?? 0
  const used = users
    ? t('proxyGroup.usedBy', {
        count: users,
        defaultValue_one: '{{count}} device uses it as its exit',
        defaultValue_other: '{{count}} devices use it as their exit',
      })
    : t('proxyGroup.usedByNone', 'No device uses it as its exit')
  const has = endpoints
    ? t('proxyGroup.endpoints', {
        count: endpoints,
        defaultValue_one: 'it has {{count}} endpoint',
        defaultValue_other: 'it has {{count}} endpoints',
      })
    : t('proxyGroup.endpointsNone', 'it has no endpoints')
  return t('proxyGroup.use', '{{used}}, and {{has}}.', { used, has })
}

// What deleting a group takes away, in words: its users' exit, and its endpoints.
export function deletingLine(t: TFunction, group: Pick<ProxyGroup, 'users' | 'endpoints'>): string {
  if (group.users && group.endpoints)
    return t(
      'proxyGroup.deleteUsersEndpoints',
      'Deleted, the devices using it go their usual way, and its endpoints are removed.'
    )
  if (group.users) return t('proxyGroup.deleteUsers', 'Deleted, the devices using it go their usual way.')
  if (group.endpoints) return t('proxyGroup.deleteEndpoints', 'Deleted, its endpoints are removed.')
  return t('proxyGroup.deleteNothing', 'Deleted, nothing else changes: nothing uses it.')
}

// What keeping a group whose last device goes does to what it has: its users dormant, their traffic going its usual way.
export function keepingLines(t: TFunction, group: Pick<ProxyGroup, 'users' | 'endpoints'>): string[] {
  const lines = [t('lastInGroup.keepWaits', 'Kept, it waits for another device to be added to it.')]
  if (group.users)
    lines.push(
      t(
        'lastInGroup.keepDormant',
        'The devices using it stay on it, dormant: their traffic goes its usual way until a device added to it is in service.'
      )
    )
  if (group.endpoints)
    lines.push(t('lastInGroup.keepEndpoints', 'Its endpoints keep their addresses, and work again then.'))
  return lines
}

// Whether a group's users are dormant now: it has none in service, and some use it.
export const dormantUsers = (group: Pick<ProxyGroup, 'dormant' | 'users'>) => !!group.dormant && !!group.users

// Its users dormant, in words.
export const dormantLine = (t: TFunction) =>
  t(
    'proxyGroup.dormant',
    'No device in it is in service: the devices using it are dormant, their traffic going its usual way until one is.'
  )

// Who a group is shared with, in words; none where it is shared with no one, or the API does not say.
export function sharedLine(t: TFunction, group: Pick<ProxyGroup, 'access'>): string {
  const emails = (group.access ?? []).map(share => share.user.email || share.user.id)
  return emails.length ? t('proxyGroup.sharedWith', 'Shared with {{emails}}.', { emails: emails.join(', ') }) : ''
}

// A group shared with you as an exit choice is named: its name, and whose it is.
export const sharedChoiceName = (t: TFunction, group: Pick<ProxyGroup, 'name' | 'owner'>) =>
  group.owner?.email
    ? t('proxyGroup.sharedChoice', '{{group}} · shared by {{email}}', { group: group.name, email: group.owner.email })
    : group.name

// What stopping a device being a proxy does to its group, where it is not the last device in it (or stays in it as an
// exit): its group's endpoints are the group's. Unknown group: an API from before groups kept them, so as it said then.
export function proxyOffLine(t: TFunction, group: ProxyGroup | null | undefined, deviceId: string): string {
  if (!group) return t('deviceProxy.removeConfirmBody', 'Every endpoint on it is removed, for everyone using one.')
  if (!lastInGroup(group, deviceId))
    return t('deviceProxy.removeOthers', 'The other devices in its group, {{group}}, go on serving its endpoints.', {
      group: group.name,
    })
  return t(
    'deviceProxy.removeStaysExit',
    'It stays in its group, {{group}}, as an exit. The group keeps its endpoints: they work again once a proxy is added to it.',
    { group: group.name }
  )
}

// What stopping a device offering itself as an exit does to those using its group, where it is not the last device in
// it (or stays in it as a proxy). Unknown group, as an API from before groups said it; and the last exit of one of
// remote.it's groups, whose users are moved off it, as they always were.
export function exitOffLine(t: TFunction, group: ProxyGroup | null | undefined, deviceId: string): string {
  if (!group || (group.remoteit && lastInGroup(group, deviceId)))
    return t('deviceExit.offerOffConfirmBody', 'Everyone sending their traffic out through it now is cut off.')
  if (!lastInGroup(group, deviceId))
    return t(
      'deviceExit.offerOffOthers',
      'Those using its group, {{group}}, as their exit go out through another exit in it, or wait for one.',
      { group: group.name }
    )
  const stays = t('deviceExit.offerOffStays', 'It stays in its group, {{group}}, as a proxy.', { group: group.name })
  return group.users
    ? `${stays} ${t(
        'deviceExit.offerOffWaiting',
        'The devices using the group as their exit have their traffic stopped until it offers itself again, or another exit is added.'
      )}`
    : stays
}
