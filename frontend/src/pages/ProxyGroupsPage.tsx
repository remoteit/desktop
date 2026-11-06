import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useSelector } from 'react-redux'
import { List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import {
  ProxyGroup,
  graphQLAccountProxyGroups,
  graphQLAddProxyGroupTag,
  graphQLDeleteProxyGroup,
  graphQLRemoveProxyGroupTag,
  graphQLSharedProxyGroups,
  graphQLUnshareProxyGroup,
  proxyGroupSharesServed,
  proxyGroupTagsServed,
  refusalOf,
} from '../services/graphQLProxyGroups'
import {
  deletingLine,
  deletingTakesAway,
  dormantLine,
  dormantUsers,
  emptyGroup,
  groupUse,
  sharedLine,
} from '../helpers/proxyGroupHelper'
import { useDisabledDevicesAccess } from '../hooks/useDeviceDisable'
import { ProxyGroupShareDialog } from '../components/ProxyGroupShareDialog'
import { ProxyGroupTagEditor } from '../components/ProxyGroupTagEditor'
import { Tags } from '../components/Tags'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

/* The account's own proxy and exit groups (graphql-api docs/PROXY-GROUPS.md §11): each with its devices, the devices
   using it as their exit and its endpoints. A group whose last device has gone is kept — its name, endpoints and users,
   dormant — until it is deleted here; Delete says what goes with it. Each is shared from here with people, to use as
   their exit (Share), and tagged with the account's tags, by which a role scoped by tags reaches it; a tag clicked shows
   only the groups carrying it. The groups shared with you are listed below theirs, each to leave. Seen by those who may
   manage devices here, as the account's disabled devices are, each the groups they manage: a role scoped by tags, those
   its tags reach. The full groups UI comes later: this lists them, shares and tags them, and deletes an empty one. */
export const ProxyGroupsPage: React.FC = () => {
  const { t } = useTranslation()
  const accountId = useSelector(selectActiveAccountId)
  const access = useDisabledDevicesAccess()
  const [groups, setGroups] = useState<ProxyGroup[] | 'ERROR' | typeof UNSUPPORTED>()
  const [shared, setShared] = useState<ProxyGroup[]>([])
  const [sharing, setSharing] = useState<string>() // the label of the group whose shares are open
  const [shares, setShares] = useState(false)
  const [tagging, setTagging] = useState(false) // the API tags groups
  const [tagFilter, setTagFilter] = useState<ITag>() // only the groups carrying it are shown
  const [tagRefusal, setTagRefusal] = useState<string>()
  const [deleting, setDeleting] = useState<ProxyGroup>()
  const [leaving, setLeaving] = useState<ProxyGroup>()
  const [refusal, setRefusal] = useState<string>()
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const served = await proxyGroupSharesServed()
    setShares(served)
    setTagging(await proxyGroupTagsServed())
    setGroups(await graphQLAccountProxyGroups(accountId))
    const theirs = served ? await graphQLSharedProxyGroups() : []
    setShared(Array.isArray(theirs) ? theirs : [])
  }, [accountId])

  useEffect(() => {
    setGroups(undefined)
    if (access) load()
  }, [access, load])

  if (!access)
    return (
      <Body center>
        <Typography variant="body2" color="textSecondary">
          {t('proxyGroupsPage.noManageAccess', 'Groups are seen by those who may manage devices here.')}
        </Typography>
      </Body>
    )

  const remove = async (group: ProxyGroup) => {
    setBusy(true)
    const refused = refusalOf(await graphQLDeleteProxyGroup(group.label, deletingTakesAway(group)))
    setBusy(false)
    if (refused !== undefined) return setRefusal(refused || t('proxyGroupsPage.notDeleted', 'It could not be deleted.'))
    setDeleting(undefined)
    await load()
  }

  const leave = async (group: ProxyGroup, email: string) => {
    setBusy(true)
    const refused = refusalOf(await graphQLUnshareProxyGroup(group.label, [email]))
    setBusy(false)
    if (refused !== undefined) return setRefusal(refused || t('proxyGroupsPage.notLeft', 'It could not be left.'))
    setLeaving(undefined)
    await load()
  }

  const close = () => {
    setDeleting(undefined)
    setLeaving(undefined)
    setRefusal(undefined)
  }

  // A tag put on or taken off, then the groups read again: a refusal is said above the list, in graphql's words.
  const retag = async (change: () => ReturnType<typeof graphQLAddProxyGroupTag>) => {
    setBusy(true)
    const refused = refusalOf(await change())
    setBusy(false)
    setTagRefusal(
      refused === undefined
        ? undefined
        : refused || t('proxyGroupsPage.tagsNotChanged', 'Its tags could not be changed.')
    )
    await load()
  }

  const open = Array.isArray(groups) ? groups.find(group => group.label === sharing) : undefined
  const shown = Array.isArray(groups) && tagFilter ? groups.filter(group => carries(group, tagFilter)) : groups
  const myShare = (group: ProxyGroup) => group.access?.[0]?.user.email ?? ''

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>{t('proxyGroupsPage.title', 'Proxy and exit groups')}</Title>
          </Typography>
          <Gutters bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t(
                'proxyGroupsPage.description',
                'Every proxy and exit is in a group, its own to begin with. A group whose last device has gone is kept — its endpoints, and the devices using it as their exit — for another device to be added to it, until you delete it.'
              )}
            </Typography>
          </Gutters>
        </>
      }
    >
      {tagRefusal && (
        <Notice severity="error" gutterTop>
          {tagRefusal}
        </Notice>
      )}
      {groups === undefined ? (
        <LoadingMessage />
      ) : groups === UNSUPPORTED ? (
        <Notice gutterTop>
          {t('proxyGroupsPage.unsupported', 'This server does not have proxy and exit groups.')}
        </Notice>
      ) : groups === 'ERROR' ? (
        <Notice severity="error" gutterTop>
          {t('proxyGroupsPage.failed', 'The groups could not be read.')}
        </Notice>
      ) : !groups.length ? (
        <Body center>
          <Typography variant="body2" color="textSecondary">
            {t('proxyGroupsPage.none', 'No groups yet: a device made a proxy or an exit is put in one.')}
          </Typography>
        </Body>
      ) : (
        <List>
          {tagFilter && (
            <ListItem data-tag-filter={tagFilter.name}>
              <ListItemText
                primary={t('proxyGroupsPage.tagFilter', 'Groups tagged')}
                secondary={
                  !Array.isArray(shown) || !shown.length
                    ? t('proxyGroupsPage.tagFilterNone', 'None of your groups carries it.')
                    : undefined
                }
              />
              <Tags tags={[tagFilter]} onDelete={() => setTagFilter(undefined)} />
            </ListItem>
          )}
          {(Array.isArray(shown) ? shown : []).map(group => (
            <ListItem
              key={group.label}
              data-group={group.label}
              secondaryAction={
                <>
                  {shares && group.access && !group.remoteit && (
                    <IconButton
                      icon="share"
                      title={t('proxyGroupsPage.share', 'Share group')}
                      disabled={busy}
                      onClick={() => setSharing(group.label)}
                    />
                  )}
                  {emptyGroup(group) && (
                    <IconButton
                      icon="trash"
                      title={t('proxyGroupsPage.delete', 'Delete group')}
                      disabled={busy}
                      onClick={() => setDeleting(group)}
                    />
                  )}
                </>
              }
            >
              <ListItemIcon>
                <Icon name={group.host ? 'server' : 'door-open'} size="md" fixedWidth />
              </ListItemIcon>
              <ListItemText
                primary={group.name}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <>
                    {groupLines(t, group)}
                    {tagging && group.tags && !group.remoteit && (
                      <ProxyGroupTagEditor
                        group={group}
                        disabled={busy}
                        onAdd={tag => retag(() => graphQLAddProxyGroupTag(group.label, [tag.name]))}
                        onRemove={tag => retag(() => graphQLRemoveProxyGroupTag(group.label, [tag.name]))}
                        onClick={setTagFilter}
                      />
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      {!!shared.length && (
        <>
          <Gutters top="lg">
            <Typography variant="subtitle1">{t('proxyGroupsPage.sharedHeading', 'Shared with you')}</Typography>
          </Gutters>
          <List>
            {shared.map(group => (
              <ListItem
                key={group.label}
                data-shared={group.label}
                secondaryAction={
                  <IconButton
                    icon="arrow-right-from-bracket"
                    title={t('proxyGroupsPage.leave', 'Leave group')}
                    disabled={busy || !myShare(group)}
                    onClick={() => setLeaving(group)}
                  />
                }
              >
                <ListItemIcon>
                  <Icon name="door-open" size="md" fixedWidth />
                </ListItemIcon>
                <ListItemText primary={group.name} secondary={sharedGroupLine(t, group)} />
              </ListItem>
            ))}
          </List>
        </>
      )}
      {open && <ProxyGroupShareDialog group={open} open onClose={() => setSharing(undefined)} onChanged={load} />}
      {leaving && (
        <Confirm
          open
          title={t('proxyGroupsPage.leaveTitle', 'Leave {{group}}?', { group: leaving.name })}
          action={t('proxyGroupsPage.leaveAction', 'Leave')}
          color="error"
          disabled={busy}
          onConfirm={() => leave(leaving, myShare(leaving))}
          onDeny={close}
        >
          <Typography variant="body2" gutterBottom>
            {t(
              'proxyGroupsPage.leaveBody',
              'You can no longer use it as an exit: a device of yours using it goes its usual way.'
            )}
          </Typography>
          {refusal && (
            <Notice severity="error" fullWidth>
              {refusal}
            </Notice>
          )}
        </Confirm>
      )}
      {deleting && (
        <Confirm
          open
          title={t('proxyGroupsPage.deleteTitle', 'Delete {{group}}?', { group: deleting.name })}
          action={t('proxyGroupsPage.deleteAction', 'Delete')}
          color="error"
          disabled={busy}
          onConfirm={() => remove(deleting)}
          onDeny={close}
        >
          <Typography variant="body2" gutterBottom>
            {groupUse(t, deleting)} {deletingLine(t, deleting)}
          </Typography>
          {refusal && (
            <Notice severity="error" fullWidth>
              {refusal}
            </Notice>
          )}
        </Confirm>
      )}
    </Container>
  )
}

// Whether a group carries a tag, by name case aside, as graphql compares tag names.
export const carries = (group: ProxyGroup, tag: ITag): boolean =>
  !!group.tags?.some(carried => carried.name.toLowerCase() === tag.name.toLowerCase())

// A group of the account, in words: its devices, its use — dormant when it is —, and who it is shared with.
export function groupLines(t: TFunction, group: ProxyGroup): string {
  return [membersLine(t, group), groupUse(t, group), dormantUsers(group) ? dormantLine(t) : '', sharedLine(t, group)]
    .filter(Boolean)
    .join(' ')
}

// A group shared with you, in words: whose it is, and whether a device can choose it now.
export function sharedGroupLine(t: TFunction, group: ProxyGroup): string {
  const whose = group.owner?.email
    ? t('proxyGroupsPage.sharedBy', 'Shared by {{email}}.', { email: group.owner.email })
    : ''
  const now = group.offered
    ? t('proxyGroupsPage.sharedOffered', 'A device of yours can use it as its exit.')
    : t('proxyGroupsPage.sharedNotOffered', 'No device in it is in service: it cannot be chosen until one is.')
  return [whose, now].filter(Boolean).join(' ')
}

// Who is in a group, in words: its devices by name, or none.
export function membersLine(t: TFunction, group: ProxyGroup): string {
  if (!group.members) return ''
  if (!group.members.length) return t('proxyGroupsPage.noDevices', 'No device in it.')
  return t('proxyGroupsPage.devices', 'In it: {{names}}.', {
    names: group.members.map(member => member.name || member.id).join(', '),
  })
}
