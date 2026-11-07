import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ListItem, ListItemIcon, ListItemText, ListSubheader, MenuItem, TextField } from '@mui/material'
import {
  DeviceNetwork,
  NetworkExitGroup,
  graphQLNetworkExitGroups,
  graphQLSetNetworkExitGroup,
} from '../services/graphQLDeviceNetworks'
import { ProxyGroup, graphQLAccountProxyGroups, refusalOf } from '../services/graphQLProxyGroups'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from './Gutters'
import { Icon } from './Icon'
import { Notice } from './Notice'

/* A network's exits (graphql-api docs/PROXY-GROUPS.md §11, "A network's exits are groups"): the own exit groups it makes
   available to its devices — each one initiating on it may send its traffic out through one, whichever of the group's
   devices takes it, while it is offered. Its managers add one of the account's own groups offered now, and remove one;
   one another account made available says whose it is. A refusal is said in graphql's words. Shown where the API serves
   it, never on a link. */
export const NetworkExitGroups: React.FC<{ network: DeviceNetwork; accountId: string }> = ({ network, accountId }) => {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<NetworkExitGroup[] | null>(null)
  const [choices, setChoices] = useState<ProxyGroup[]>([])
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const manage = network.permissions.includes('MANAGE')

  const load = useCallback(async () => {
    const all = await graphQLNetworkExitGroups(accountId)
    setGroups(all instanceof Map ? all.get(network.id) ?? [] : null)
    if (!(all instanceof Map) || !manage) return
    // The account's own groups, for whoever manages it: those offered now may be made available.
    const own = await graphQLAccountProxyGroups(accountId)
    setChoices(Array.isArray(own) ? own.filter(group => !group.remoteit && group.offered) : [])
  }, [accountId, network.id, manage])

  useEffect(() => {
    load()
  }, [load])

  if (!groups || network.kind === 'LINK') return null

  const available = new Set(groups.map(group => group.label))
  const addable = choices.filter(group => !available.has(group.label))
  const set = async (label: string, exit: boolean) => {
    setBusy(true)
    setAdding(false)
    const reason = refusalOf(await graphQLSetNetworkExitGroup(network.id, label, exit))
    setRefusal(reason === undefined ? undefined : reason || t('networkExits.failed', 'Not changed: try again'))
    await load()
    setBusy(false)
  }

  // Under the network's devices, in their list.
  return (
    <>
      <ListSubheader>
        {t('networkExits.title', 'Exits')}
        {manage && !!addable.length && (
          <IconButton
            icon="plus"
            title={t('networkExits.add', 'Make an exit group available')}
            size="sm"
            disabled={busy}
            onClick={() => setAdding(!adding)}
          />
        )}
      </ListSubheader>
      {adding && (
        <Gutters>
          <TextField
            select
            fullWidth
            size="small"
            label={t('networkExits.choose', 'Exit group')}
            value=""
            onChange={event => set(String(event.target.value), true)}
          >
            {addable.map(group => (
              <MenuItem key={group.label} value={group.label}>
                {group.name}
              </MenuItem>
            ))}
          </TextField>
        </Gutters>
      )}
      {groups.map(group => (
        <ListItem
          key={group.label}
          dense
          secondaryAction={
            manage && (
              <IconButton
                icon="times"
                title={t('networkExits.remove', 'Stop making it available')}
                size="sm"
                disabled={busy}
                onClick={() => set(group.label, false)}
              />
            )
          }
        >
          <ListItemIcon>
            <Icon name="arrow-right-from-bracket" size="md" color={group.offered ? undefined : 'grayDark'} />
          </ListItemIcon>
          <ListItemText primary={group.name} secondary={exitGroupLine(t, group, network.owner.id)} />
        </ListItem>
      ))}
      {!groups.length && (
        <ListItem dense>
          <ListItemText
            secondary={t(
              'networkExits.none',
              'No exit group: its devices send their traffic out through an exit only by their own choice. Make one of your exit groups available, and each device initiating here may choose it.'
            )}
          />
        </ListItem>
      )}
      {refusal && (
        <Gutters>
          <Notice severity="warning" fullWidth>
            {refusal}
          </Notice>
        </Gutters>
      )}
    </>
  )
}

// What a group made available is now, for the devices initiating on the network — and whose it is, when not the
// network's account's.
export function exitGroupLine(t: TFunction, group: NetworkExitGroup, networkOwner: string): string {
  const state = group.offered
    ? t('networkExits.offered', 'Its devices may choose it now')
    : group.dormant
    ? t('networkExits.dormant', 'Dormant: no device in it is in service, so it cannot be chosen until one is')
    : t('networkExits.notOffered', 'No device in it offers itself as an exit now')
  return group.owner && group.owner.id !== networkOwner && group.owner.email
    ? t('networkExits.whose', '{{state}} · {{email}}’s', { state, email: group.owner.email })
    : state
}
