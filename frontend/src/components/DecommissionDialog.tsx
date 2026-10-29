import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material'
import { Dispatch, State } from '../store'
import { Confirm } from './Confirm'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  open: boolean
  devices: Pick<IDevice, 'id' | 'name'>[]
  onClose: () => void
  onDone?: () => void
}

/* Decommission: final, so it says what goes and asks for it typed — the device's name, or for several, how many
   (graphql-api docs/DEVICE-DISABLE.md). Offered only on a disabled device. */
export const DecommissionDialog: React.FC<Props> = ({ open, devices, onClose, onDone }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const destroying = useSelector((state: State) => state.ui.destroying)
  const [typed, setTyped] = useState('')
  const single = devices.length === 1
  const expected = single ? devices[0].name : String(devices.length)
  const matches = typed.trim() === expected.trim()

  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  const lost = [
    { icon: 'clock-rotate-left', text: t('decommission.lostHistory', 'Its history: events, logs and reports') },
    { icon: 'user-group', text: t('decommission.lostShares', 'Its shares, and the access they give') },
    { icon: 'sliders', text: t('decommission.lostSettings', 'Its services, settings, tags and scripts') },
  ]

  return (
    <Confirm
      open={open}
      title={
        single
          ? t('decommission.title', { name: devices[0]?.name, defaultValue: 'Decommission "{{name}}"?' })
          : t('decommission.titleCount', {
              count: devices.length,
              defaultValue_one: 'Decommission {{count}} device?',
              defaultValue_other: 'Decommission {{count}} devices?',
            })
      }
      action={t('decommission.action', 'Decommission')}
      color="error"
      maxWidth="sm"
      disabled={!matches || destroying}
      onConfirm={async () => {
        if (!matches) return
        const done = await dispatch.devices.decommission(devices.map(d => d.id))
        onClose()
        if (done) onDone?.()
      }}
      onDeny={onClose}
    >
      <Notice severity="error" gutterBottom fullWidth>
        {t('decommission.final', "This can't be undone. Everything the cloud keeps for it goes:")}
      </Notice>
      <List dense disablePadding>
        {lost.map(item => (
          <ListItem key={item.icon} disableGutters>
            <ListItemIcon>
              <Icon name={item.icon} size="md" />
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Typography variant="body2" gutterBottom>
        {t(
          'decommission.legacy',
          'A device running older software keeps checking in until that software is removed, and is refused quietly. A device on current software removes its own key and stops.'
        )}
      </Typography>
      <Typography variant="body2" sx={{ marginTop: 2 }}>
        {single
          ? t('decommission.typeName', { name: expected, defaultValue: 'Type the device name, {{name}}, to confirm.' })
          : t('decommission.typeCount', {
              count: devices.length,
              defaultValue_one: 'Type {{count}}, the number of devices, to confirm.',
              defaultValue_other: 'Type {{count}}, the number of devices, to confirm.',
            })}
      </Typography>
      <TextField
        autoFocus
        fullWidth
        size="small"
        variant="filled"
        value={typed}
        label={single ? t('decommission.nameLabel', 'Device name') : t('decommission.countLabel', 'Number of devices')}
        onChange={e => setTyped(e.target.value)}
        inputProps={{ 'aria-label': 'decommission-confirm', autoComplete: 'off', spellCheck: false }}
        sx={{ marginTop: 1 }}
      />
    </Confirm>
  )
}
