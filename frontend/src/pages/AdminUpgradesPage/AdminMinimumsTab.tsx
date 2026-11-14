import React, { useCallback, useEffect, useState } from 'react'
import { Box, Button, List, ListItem, ListItemText, Stack, TextField, Typography } from '@mui/material'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'
import { IconButton } from '../../buttons/IconButton'
import { UNSUPPORTED } from '../../services/graphQLDaemon'
import {
  DeviceMinimum,
  MINIMUM_KINDS,
  graphQLDeviceMinimums,
  graphQLSetDeviceMinimum,
} from '../../services/graphQLDeviceMinimums'
import { UpgradesTabs } from './UpgradesTabs'

/* The Upgrades page's Minimums tab (?view=minimums): the oldest daemon build each kind of device may run. Below it, a
   device's agent page warns its people to update it, and says how by its kind (graphql's DeviceAgent.supported). Set
   one when the cloud stops speaking what older builds need — retiring a protocol form, after graphql's
   bin/retirement-check — to the build that brought its replacement. English only, as the rest of /admin. */
export const AdminMinimumsTab: React.FC = () => {
  const [minimums, setMinimums] = useState<DeviceMinimum[] | 'ERROR' | typeof UNSUPPORTED>()
  const [editing, setEditing] = useState<string>()

  const load = useCallback(async () => {
    setMinimums(undefined)
    setMinimums(await graphQLDeviceMinimums())
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const header = (
    <Gutters>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="h2">Upgrades</Typography>
        <IconButton icon="sync" title="Refresh" onClick={load} spin={minimums === undefined} size="md" />
      </Stack>
      <UpgradesTabs value="minimums" />
    </Gutters>
  )

  let body: React.ReactNode
  if (minimums === undefined) body = <LoadingMessage message="Loading minimums..." />
  else if (minimums === UNSUPPORTED)
    body = <Notice fullWidth>This API has no device minimums: graphql before its device-minimum resolver.</Notice>
  else if (minimums === 'ERROR')
    body = (
      <Notice severity="error" fullWidth>
        Could not read the minimums.
      </Notice>
    )
  else {
    const byKind = new Map(minimums.map(m => [m.kind, m]))
    body = (
      <>
        <Typography variant="body2" color="textSecondary" paddingBottom={1}>
          A device whose daemon is older than its kind's minimum — or, with none of its own, every kind's — is told on
          its agent page to update, and how. Set one when the cloud stops speaking what older builds need. A minimum is
          a package or connectd version with its stamp (1.1.0.20261108160000), or a date (2026-11-08).
        </Typography>
        <List disablePadding>
          {MINIMUM_KINDS.map(({ kind, label, hint }) => (
            <MinimumRow
              key={kind}
              kind={kind}
              label={label}
              hint={hint}
              current={byKind.get(kind)}
              editing={editing === kind}
              onEdit={() => setEditing(kind)}
              onDone={set => {
                setEditing(undefined)
                if (set !== undefined) setMinimums(minimums.filter(m => m.kind !== kind).concat(set ? [set] : []))
              }}
            />
          ))}
        </List>
      </>
    )
  }

  return (
    <Container integrated gutterBottom header={header}>
      <Gutters>{body}</Gutters>
    </Container>
  )
}

type RowProps = {
  kind: string
  label: string
  hint: string
  current?: DeviceMinimum
  editing: boolean
  onEdit: () => void
  // What is set now once saved (null: cleared), or undefined when the edit was cancelled.
  onDone: (set?: DeviceMinimum | null) => void
}

const MinimumRow: React.FC<RowProps> = ({ kind, label, hint, current, editing, onEdit, onDone }) => {
  const [minimum, setMinimum] = useState(current?.minimum ?? '')
  const [message, setMessage] = useState(current?.message ?? '')
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) return
    setMinimum(current?.minimum ?? '')
    setMessage(current?.message ?? '')
    setError(undefined)
  }, [editing, current])

  const save = async (clear?: boolean) => {
    setSaving(true)
    const result = await graphQLSetDeviceMinimum(kind, clear ? '' : minimum, clear ? '' : message)
    setSaving(false)
    if ('error' in result) setError(result.error)
    else onDone(result.set)
  }

  return (
    <ListItem disableGutters divider data-minimum={kind} sx={{ display: 'block' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <ListItemText
          primary={
            <>
              {label}
              <Typography component="span" variant="caption" color="textSecondary" marginLeft={1}>
                {kind}
              </Typography>
            </>
          }
          secondary={
            current ? (
              <>
                {`${current.minimum} or newer`}
                {current.message && <> — {current.message}</>}
              </>
            ) : (
              hint
            )
          }
        />
        {!editing && (
          <Button size="small" onClick={onEdit} data-edit={kind}>
            {current ? 'Change' : 'Set'}
          </Button>
        )}
      </Stack>
      {editing && (
        <Box paddingY={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              size="small"
              label="Minimum"
              placeholder="1.1.0.20261108160000 or 2026-11-08"
              value={minimum}
              onChange={e => setMinimum(e.target.value)}
              inputProps={{ 'data-field': 'minimum' }}
              sx={{ minWidth: 260 }}
            />
            <TextField
              size="small"
              label="Why (shown to the device's people)"
              value={message}
              onChange={e => setMessage(e.target.value)}
              inputProps={{ 'data-field': 'message', maxLength: 500 }}
              fullWidth
            />
          </Stack>
          {error && (
            <Typography variant="caption" color="error" display="block" marginTop={0.5} data-error>
              {error}
            </Typography>
          )}
          <Stack direction="row" spacing={1} marginTop={1}>
            <Button size="small" variant="contained" disabled={saving || !minimum.trim()} onClick={() => save()}>
              Save
            </Button>
            {current && (
              <Button size="small" color="error" disabled={saving} onClick={() => save(true)}>
                Clear
              </Button>
            )}
            <Button size="small" disabled={saving} onClick={() => onDone(undefined)}>
              Cancel
            </Button>
          </Stack>
        </Box>
      )}
    </ListItem>
  )
}
