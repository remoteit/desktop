import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, Button, ListItem, ListItemIcon, ListItemText, ListSubheader, MenuItem, TextField, Typography } from '@mui/material'
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

/* A network's exits (graphql-api docs/PROXY-GROUPS.md §13): the exits its devices that can reach may route through,
   whichever of the exit's devices takes the traffic. Its managers add one of the account's own exits, and remove one;
   one another account added says whose it is. A refusal is said in graphql's words. Never on a link. */
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
    setRefusal(
      reason === undefined ? undefined : reason || t('networkExits.failed', 'Couldn’t change the exits. Try again.')
    )
    await load()
    setBusy(false)
  }

  // Under the network's devices, in their list.
  return (
    <>
      <ListSubheader
        sx={{ display: 'flex', alignItems: 'center', marginTop: 2, borderTop: 1, borderColor: 'grayLight.main' }}
      >
        {t('networkExits.title', 'Route through')}
        {manage && !!addable.length && (
          <Box sx={{ marginLeft: 'auto' }}>
            <Button size="small" data-add-exit disabled={busy} onClick={() => setAdding(!adding)}>
              {t('networkExits.add', 'Add exit')}
            </Button>
          </Box>
        )}
      </ListSubheader>
      {!!exits.length && (
        <Gutters top="xs" bottom="xs">
          <Typography variant="caption" component="p" color="textSecondary">
            {t('networkExits.intro', 'Devices in this network can route through these exits.')}
          </Typography>
        </Gutters>
      )}
      {adding && (
        <Gutters>
          <TextField
            variant="filled"
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
                  ? t('networkExits.chooseDormant', '{{exit}} · waiting for exit device', { exit: exit.name })
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
                title={t('networkExits.remove', 'Remove {{exit}}', { exit: exit.name })}
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
        <Gutters top="xs" bottom="sm">
          <Typography variant="caption" component="p" color="textSecondary">
            {t('networkExits.none', 'No exits yet. Add one so devices in this network can route through it.')}
          </Typography>
        </Gutters>
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

// What an exit is now, for the network's devices — and whose it is, when not the network's account's.
export function exitLine(t: TFunction, exit: NetworkExit, networkOwner: string): string {
  const state = exit.offered
    ? t('networkExits.offered', 'Ready')
    : exit.dormant
    ? t('networkExits.dormant', 'Waiting for exit device')
    : t('networkExits.notOffered', 'Not available now')
  return exit.owner && exit.owner.id !== networkOwner && exit.owner.email
    ? t('networkExits.whose', '{{state}} · from {{email}}', { state, email: exit.owner.email })
    : state
}
