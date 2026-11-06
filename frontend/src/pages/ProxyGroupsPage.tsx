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
  graphQLDeleteProxyGroup,
  refusalOf,
} from '../services/graphQLProxyGroups'
import { deletingLine, deletingTakesAway, emptyGroup, groupUse } from '../helpers/proxyGroupHelper'
import { useDisabledDevicesAccess } from '../hooks/useDeviceDisable'
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
   using it as their exit and its endpoints. A group whose last device has gone is kept — its name, endpoints and users —
   until it is deleted here; Delete says what goes with it. Seen by those who may manage devices here, as the account's
   disabled devices are. The full groups UI comes later: this lists them, and deletes an empty one. */
export const ProxyGroupsPage: React.FC = () => {
  const { t } = useTranslation()
  const accountId = useSelector(selectActiveAccountId)
  const access = useDisabledDevicesAccess()
  const [groups, setGroups] = useState<ProxyGroup[] | 'ERROR' | typeof UNSUPPORTED>()
  const [deleting, setDeleting] = useState<ProxyGroup>()
  const [refusal, setRefusal] = useState<string>()
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => setGroups(await graphQLAccountProxyGroups(accountId)), [accountId])

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

  const close = () => {
    setDeleting(undefined)
    setRefusal(undefined)
  }

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
          {groups.map(group => (
            <ListItem
              key={group.label}
              data-group={group.label}
              secondaryAction={
                emptyGroup(group) && (
                  <IconButton
                    icon="trash"
                    title={t('proxyGroupsPage.delete', 'Delete group')}
                    disabled={busy}
                    onClick={() => setDeleting(group)}
                  />
                )
              }
            >
              <ListItemIcon>
                <Icon name={group.host ? 'server' : 'door-open'} size="md" fixedWidth />
              </ListItemIcon>
              <ListItemText primary={group.name} secondary={`${membersLine(t, group)} ${groupUse(t, group)}`} />
            </ListItem>
          ))}
        </List>
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

// Who is in a group, in words: its devices by name, or none.
export function membersLine(t: TFunction, group: ProxyGroup): string {
  if (!group.members) return ''
  if (!group.members.length) return t('proxyGroupsPage.noDevices', 'No device in it.')
  return t('proxyGroupsPage.devices', 'In it: {{names}}.', {
    names: group.members.map(member => member.name || member.id).join(', '),
  })
}
