import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { Dispatch, State } from '../store'
import { Confirm } from './Confirm'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = { device: IDevice; onClick?: () => void; onCancel?: () => void }

/* Disable: what Delete was (graphql-api docs/DEVICE-DISABLE.md). It is what stops a device, so an online one may be
   disabled; it can be restored at any time. */
export const DisableDevice: React.FC<Props> = ({ device, onClick, onCancel }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const userId = useSelector((state: State) => state.auth.user?.id)
  const destroying = useSelector((state: State) => state.ui.destroying)
  const [open, setOpen] = useState(false)

  if (device.shared || device.disabled || (device.accountId !== userId && !device.permissions.includes('MANAGE')))
    return null

  return (
    <>
      <MenuItem dense onClick={() => setOpen(true)} disabled={destroying}>
        <ListItemIcon>
          <Icon name={destroying ? 'spinner-third' : 'ban'} spin={destroying} size="md" fixedWidth />
        </ListItemIcon>
        <ListItemText primary={t('disableDevice.title', 'Disable Device')} />
      </MenuItem>
      <DisableConfirm
        open={open}
        count={1}
        name={device.name}
        onConfirm={async () => {
          setOpen(false)
          onClick?.()
          await dispatch.devices.disable([device.id])
        }}
        onDeny={() => {
          setOpen(false)
          onCancel?.()
        }}
      />
    </>
  )
}

export const DisableConfirm: React.FC<{
  open: boolean
  count: number
  name?: string
  onConfirm: () => void
  onDeny: () => void
}> = ({ open, count, name, onConfirm, onDeny }) => {
  const { t } = useTranslation()
  return (
    <Confirm
      open={open}
      title={
        count === 1 && name
          ? t('disableDevice.confirmTitle', { name, defaultValue: 'Disable "{{name}}"?' })
          : t('disableDevice.confirmTitleCount', {
              count,
              defaultValue_one: 'Disable {{count}} device?',
              defaultValue_other: 'Disable {{count}} devices?',
            })
      }
      action={t('disableDevice.action', 'Disable')}
      color="error"
      onConfirm={onConfirm}
      onDeny={onDeny}
    >
      <Notice severity="warning" gutterBottom fullWidth>
        {t('disableDevice.stops', {
          count,
          defaultValue_one:
            'It stops serving now: its connections end, and its services, shares and scripts stop working.',
          defaultValue_other:
            'They stop serving now: their connections end, and their services, shares and scripts stop working.',
        })}
      </Notice>
      <Typography variant="body2">
        {t('disableDevice.restorable', {
          count,
          defaultValue_one: 'Nothing is lost: you can restore it at any time, from Disabled devices.',
          defaultValue_other: 'Nothing is lost: you can restore them at any time, from Disabled devices.',
        })}
      </Typography>
    </Confirm>
  )
}
