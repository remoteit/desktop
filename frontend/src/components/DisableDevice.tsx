import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { MenuItem, ListItemIcon, ListItemText, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material'
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

  // Whoever may manage the device may disable it — its owner, a role, or a share that grants MANAGE — as graphql decides.
  if (device.disabled || (device.accountId !== userId && !device.permissions.includes('MANAGE'))) return null

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
        devices={[device]}
        onConfirm={async keepHosted => {
          setOpen(false)
          onClick?.()
          await dispatch.devices.disable({ ids: [device.id], keepHosted })
        }}
        onDeny={() => {
          setOpen(false)
          onCancel?.()
        }}
      />
    </>
  )
}

/* The confirmation, for one device or those ticked. A gateway among them that hosts virtual devices asks what becomes
   of them, as Delete asked: kept live and unhosted (graphql's default), or disabled with it and restored with it.
   keepHosted is sent only then. */
export const DisableConfirm: React.FC<{
  open: boolean
  devices: IDevice[]
  onConfirm: (keepHosted?: boolean) => void
  onDeny: () => void
}> = ({ open, devices, onConfirm, onDeny }) => {
  const { t } = useTranslation()
  const [keepHosted, setKeepHosted] = useState(true)
  const count = devices.length
  const name = count === 1 ? devices[0].name : undefined
  const hosts = devices.reduce((sum, d) => sum + (d.hosts || 0), 0)
  const hostedNames = devices.flatMap(d => d.hostedDevices?.map(h => h.name) || [])
  const thisDevice = devices.some(d => d.thisDevice)

  useEffect(() => {
    if (open) setKeepHosted(true)
  }, [open])

  return (
    <Confirm
      open={open}
      title={
        name
          ? t('disableDevice.confirmTitle', { name, defaultValue: 'Disable "{{name}}"?' })
          : t('disableDevice.confirmTitleCount', {
              count,
              defaultValue_one: 'Disable {{count}} device?',
              defaultValue_other: 'Disable {{count}} devices?',
            })
      }
      action={t('disableDevice.action', 'Disable')}
      color="error"
      onConfirm={() => onConfirm(hosts ? keepHosted : undefined)}
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
      {thisDevice && (
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          {t(
            'disableDevice.thisDevice',
            'Remote.It stays installed and registered on this machine, and serves again once the device is restored.'
          )}
        </Typography>
      )}
      {!!hosts && (
        <>
          <Typography variant="body2" sx={{ marginTop: 2 }}>
            {t('disableDevice.hosts', {
              count: hosts,
              defaultValue_one: 'It hosts {{count}} virtual device.',
              defaultValue_other: 'It hosts {{count}} virtual devices.',
            })}
          </Typography>
          <RadioGroup
            value={keepHosted ? 'keep' : 'disable'}
            onChange={event => setKeepHosted(event.target.value === 'keep')}
          >
            <FormControlLabel
              value="keep"
              control={<Radio />}
              sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { marginTop: -0.5 } }}
              label={
                <ListItemText
                  primary={t('disableDevice.keepHosted', 'Keep them, not hosted')}
                  secondary={t(
                    'disableDevice.keepHostedHint',
                    'They are no longer hosted by it: offline, keeping their services, shares and grants, until you move them to another gateway. Restoring this gateway does not bring them back to it.'
                  )}
                />
              }
            />
            <FormControlLabel
              value="disable"
              control={<Radio />}
              sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { marginTop: -0.5 } }}
              label={
                <ListItemText
                  primary={t('disableDevice.disableHosted', 'Disable them too')}
                  secondary={
                    hostedNames.length
                      ? t('disableDevice.disableHostedNamed', {
                          names: hostedNames.join(', '),
                          defaultValue: '{{names}}. Restoring the gateway restores them with it.',
                        })
                      : t('disableDevice.disableHostedHint', 'Restoring the gateway restores them with it.')
                  }
                />
              }
            />
          </RadioGroup>
        </>
      )}
    </Confirm>
  )
}
