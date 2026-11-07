import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ListItem, ListItemIcon, ListItemText, ListSubheader, MenuItem, TextField } from '@mui/material'
import type { DeviceNetwork } from '../services/graphQLDeviceNetworks'
import { refusalOf } from '../services/graphQL'
import {
  Exit,
  NetworkExit,
  graphQLAccountExits,
  graphQLNetworkExits,
  graphQLSetNetworkExit,
} from '../services/graphQLExits'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from './Gutters'
import { Icon } from './Icon'
import { Notice } from './Notice'

/* A network's exits (graphql-api docs/PROXY-GROUPS.md §13): the own exits it makes available to its devices — each one
   initiating on it may send its traffic out through one, whichever of the exit's devices takes it, while it is offered.
   Its managers make one of the account's own exits available, and stop one; one another account made available says
   whose it is. A refusal is said in graphql's words. Shown where the API serves it, never on a link. */
export const NetworkExits: React.FC<{ network: DeviceNetwork; accountId: string }> = ({ network, accountId }) => {
  const { t } = useTranslation()
  const [exits, setExits] = useState<NetworkExit[] | null>(null)
  const [choices, setChoices] = useState<Exit[]>([])
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const manage = network.permissions.includes('MANAGE')

  const load = useCallback(async () => {
    const all = await graphQLNetworkExits(accountId)
    setExits(all instanceof Map ? all.get(network.id) ?? [] : null)
    if (!(all instanceof Map) || !manage) return
    // The account's own exits, for whoever manages them: each may be made available, offered now or not.
    const own = await graphQLAccountExits(accountId)
    setChoices(own && typeof own === 'object' ? own.own : [])
  }, [accountId, network.id, manage])

  useEffect(() => {
    load()
  }, [load])

  if (!exits || network.kind === 'LINK') return null

  const available = new Set(exits.map(exit => exit.id))
  const addable = choices.filter(exit => !available.has(exit.id))
  const set = async (exit: string, on: boolean) => {
    setBusy(true)
    setAdding(false)
    const reason = refusalOf(await graphQLSetNetworkExit(network.id, exit, on))
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
            title={t('networkExits.add', 'Make an exit available')}
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
            label={t('networkExits.choose', 'Exit')}
            value=""
            onChange={event => set(String(event.target.value), true)}
          >
            {addable.map(exit => (
              <MenuItem key={exit.id} value={exit.id}>
                {exit.dormant
                  ? t('networkExits.chooseDormant', '{{exit}} · no device available', { exit: exit.name })
                  : exit.name}
              </MenuItem>
            ))}
          </TextField>
        </Gutters>
      )}
      {exits.map(exit => (
        <ListItem
          key={exit.id}
          dense
          data-network-exit={exit.id}
          secondaryAction={
            manage && (
              <IconButton
                icon="times"
                title={t('networkExits.remove', 'Stop making it available')}
                size="sm"
                disabled={busy}
                onClick={() => set(exit.id, false)}
              />
            )
          }
        >
          <ListItemIcon>
            <Icon name="door-open" size="md" color={exit.offered ? undefined : 'grayDark'} />
          </ListItemIcon>
          <ListItemText primary={exit.name} secondary={exitLine(t, exit, network.owner.id)} />
        </ListItem>
      ))}
      {!exits.length && (
        <ListItem dense>
          <ListItemText
            secondary={t(
              'networkExits.none',
              'No exit: its devices send their traffic out through an exit only by their own choice. Make one of your exits available, and each device initiating here may choose it.'
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

// What an exit made available is now, for the devices initiating on the network — and whose it is, when not the
// network's account's.
export function exitLine(t: TFunction, exit: NetworkExit, networkOwner: string): string {
  const state = exit.offered
    ? t('networkExits.offered', 'Its devices may choose it now')
    : exit.dormant
    ? t('networkExits.dormant', 'No device available: it cannot be chosen until one of its devices carries its traffic')
    : t('networkExits.notOffered', 'None of its devices takes traffic now')
  return exit.owner && exit.owner.id !== networkOwner && exit.owner.email
    ? t('networkExits.whose', '{{state}} · {{email}}’s', { state, email: exit.owner.email })
    : state
}
