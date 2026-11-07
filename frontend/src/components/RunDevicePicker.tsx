import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Box, Button, Checkbox, List, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material'
import { getAllDevices } from '../selectors/devices'
import { Notice } from './Notice'

type Props = {
  kind: 'proxy' | 'exit'
  ownerId: string // the account the proxy or exit is of: a device is added in its own account only
  exclude: string[] // the devices running it already
  busy?: boolean
  // Each device refused, by id, with graphql's words: said by its name, left chosen to try again.
  refusals?: ILookup<string>
  action?: string
  onAdd: (deviceIds: string[]) => void
  onSkip?: () => void
  skip?: string
}

/* Devices to run a proxy or an exit (graphql-api docs/PROXY-GROUPS.md §13, "No shortcuts"): those of its account you
   manage and the app has listed, by name, a search narrowing them, more than one chosen at once. Each joins out of
   service and goes into service as the proxy's or exit's activation says, once its checks pass; graphql refuses one
   that cannot run it — not online to say, a client only, the exit its own — and its refusal is said by it. */
export const RunDevicePicker: React.FC<Props> = ({
  kind,
  ownerId,
  exclude,
  busy,
  refusals = {},
  action,
  onAdd,
  onSkip,
  skip,
}) => {
  const { t } = useTranslation()
  const devices = useSelector(getAllDevices)
  const [search, setSearch] = useState('')
  const [chosen, setChosen] = useState<string[]>([])
  const owner = ownerId.toUpperCase()
  const excluded = new Set(exclude.map(id => id.toUpperCase()))

  const candidates = devices
    .filter(
      (device, index, all) =>
        all.findIndex(other => other.id === device.id) === index &&
        device.owner?.id?.toUpperCase() === owner &&
        device.permissions.includes('MANAGE') &&
        !device.virtual &&
        !device.disabled &&
        !excluded.has(device.id.toUpperCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))
  // The search field shows with more than eight to choose from, and stays while a search is set, so a search is never
  // left narrowing the list unseen.
  const searching = candidates.length > 8 || !!search
  const shown = search.trim()
    ? candidates.filter(device => device.name.toLowerCase().includes(search.trim().toLowerCase()))
    : candidates
  const refused = Object.keys(refusals)
  // Only the chosen devices it still lists are counted and added: one added meanwhile, or gone, is no longer chosen.
  const listed = chosen.filter(id => candidates.some(device => device.id === id))
  const ids = candidates.map(device => device.id).join()

  useEffect(() => {
    setChosen(list => {
      const still = list.filter(id => candidates.some(device => device.id === id))
      return still.length === list.length ? list : still
    })
  }, [ids])

  const toggle = (id: string) => setChosen(list => (list.includes(id) ? list.filter(each => each !== id) : [...list, id]))

  return (
    <Box data-device-picker={kind}>
      {!!refused.length && (
        <Notice severity="warning" fullWidth gutterBottom>
          {refused.map(id => (
            <div key={id} data-refused={id}>
              {t('runDevicePicker.refused', '{{device}}: {{reason}}', {
                device: candidates.find(device => device.id === id)?.name || id,
                reason: refusals[id] || t('runDevicePicker.notAdded', 'not added: try again'),
              })}
            </div>
          ))}
        </Notice>
      )}
      {searching && (
        <TextField
          size="small"
          fullWidth
          label={t('runDevicePicker.search', 'Find a device')}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      )}
      {!candidates.length ? (
        <Typography variant="body2" color="textSecondary" paddingY={1}>
          {t('runDevicePicker.none', 'No device of this account that you manage is listed here.')}
        </Typography>
      ) : (
        <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
          {shown.map(device => (
            <ListItemButton key={device.id} dense data-candidate={device.id} onClick={() => toggle(device.id)}>
              <ListItemIcon>
                <Checkbox edge="start" size="small" checked={chosen.includes(device.id)} tabIndex={-1} disableRipple />
              </ListItemIcon>
              <ListItemText
                primary={device.name}
                secondary={
                  device.state === 'active'
                    ? t('runDevicePicker.online', 'Online')
                    : t('runDevicePicker.offline', 'Offline: it is refused until it is online')
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
      <Box display="flex" gap={1} marginTop={1}>
        <Button
          variant="contained"
          size="small"
          disabled={busy || !listed.length}
          data-add
          onClick={() => onAdd(listed)}
        >
          {action ||
            t('runDevicePicker.add', {
              count: listed.length,
              defaultValue_one: 'Add {{count}} device',
              defaultValue_other: 'Add {{count}} devices',
            })}
        </Button>
        {onSkip && (
          <Button size="small" disabled={busy} onClick={onSkip}>
            {skip || t('runDevicePicker.skip', 'Not now')}
          </Button>
        )}
      </Box>
    </Box>
  )
}

// Devices added one after another: each refusal by device, in graphql's words.
export async function addEach(
  deviceIds: string[],
  add: (deviceId: string) => Promise<{ runs: unknown } | { reason: string }>
): Promise<ILookup<string>> {
  const refusals: ILookup<string> = {}
  for (const id of deviceIds) {
    const result = await add(id)
    if ('reason' in result) refusals[id] = result.reason
  }
  return refusals
}
