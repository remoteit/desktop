import React, { useState } from 'react'
import { emit } from '../services/Controller'
import { Tooltip, RadioGroup, FormControlLabel, Radio, ListItemText } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Dispatch, State } from '../store'
import { DeleteButton } from '../buttons/DeleteButton'
import { Typography } from '@mui/material'
import { Notice } from './Notice'

type Props = {
  device?: IDevice
  menuItem?: boolean
  hide?: boolean
  onClick?: () => void
  onCancel?: () => void
}

export const DeleteDevice: React.FC<Props> = ({ device, menuItem, hide, onClick, onCancel }) => {
  const { devices, ui } = useDispatch<Dispatch>()
  const userId = useSelector((state: State) => state.auth.user?.id)
  const destroying = useSelector((state: State) => state.ui.destroying)
  const setupBusy = useSelector((state: State) => state.ui.setupBusy)
  const setupDeletingDevice = useSelector((state: State) => state.ui.setupDeletingDevice)
  const { t } = useTranslation()
  const [keepHosted, setKeepHosted] = useState<boolean>(true)

  let disabled: boolean = false
  let icon: string = 'trash'
  let title: string = t('deleteDevice.title', 'Delete Device')
  let warning: React.ReactNode = (
    <>
      <Notice severity="error" gutterBottom fullWidth>
        {t(
          'deleteDevice.warning',
          "Deleting devices can't be undone so may require you to physically access the device if you wish to recover it."
        )}
      </Notice>
      <Typography variant="body2">
        {t('deleteDevice.uninstallRecommendation', 'We recommend uninstalling Remote.It before')} <br />
        {t('deleteDevice.deletingDevices', 'deleting devices.')}
      </Typography>
    </>
  )

  if (!device || hide || device.shared || (device.accountId !== userId && !device.permissions.includes('MANAGE')))
    return null

  const destroy = () => {
    if (device.thisDevice && device.permissions.includes('MANAGE')) {
      ui.set({ setupDeletingDevice: true, setupBusy: true, silent: device.id })
      emit('registration', 'DELETE')
    } else {
      devices.destroy({ device, keepHosted: device.hosts ? keepHosted : undefined })
    }
    onClick && onClick()
  }

  // No daemon to uninstall: a virtual device can go whatever its gateway's state.
  if (device.state === 'active' && !device.virtual) disabled = true

  if (device.virtual)
    warning = (
      <Notice severity="error" fullWidth>
        {t(
          'deleteDevice.virtualWarning',
          'You are about to permanently remove this virtual device, its services and its shares. Nothing is changed on the machine itself.'
        )}
      </Notice>
    )

  // A gateway hosting virtual devices: what becomes of them. Keeping them is the default.
  if (device.hosts)
    warning = (
      <>
        {warning}
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          {t('deleteDevice.hosts', {
            count: device.hosts,
            defaultValue_one: 'It hosts {{count}} virtual device.',
            defaultValue_other: 'It hosts {{count}} virtual devices.',
          })}
        </Typography>
        <RadioGroup
          value={keepHosted ? 'keep' : 'delete'}
          onChange={event => setKeepHosted(event.target.value === 'keep')}
        >
          <FormControlLabel
            value="keep"
            control={<Radio />}
            sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { marginTop: -0.5 } }}
            label={
              <ListItemText
                primary={t('deleteDevice.keepHosted', 'Keep them, not hosted')}
                secondary={t(
                  'deleteDevice.keepHostedHint',
                  'They go offline, keeping their services, shares and grants, until you move them to another gateway.'
                )}
              />
            }
          />
          <FormControlLabel
            value="delete"
            control={<Radio />}
            sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { marginTop: -0.5 } }}
            label={
              <ListItemText
                primary={t('deleteDevice.deleteHosted', 'Delete them too')}
                secondary={
                  device.hostedDevices?.length
                    ? t('deleteDevice.deleteHostedNamed', {
                        names: device.hostedDevices.map(h => h.name).join(', '),
                        defaultValue: '{{names}}, with their services and shares.',
                      })
                    : t('deleteDevice.deleteHostedHint', 'With their services and shares.')
                }
              />
            }
          />
        </RadioGroup>
      </>
    )

  if (device.thisDevice && device.permissions.includes('MANAGE')) {
    disabled = false
    title = t('deleteDevice.unregisterTitle', 'Unregister Device')
    warning = (
      <Notice severity="error" fullWidth>
        {t(
          'deleteDevice.unregisterWarning',
          'You are about to permanently remove this device and all of its services.'
        )}
      </Notice>
    )
  }

  const button = (
    <DeleteButton
      menuItem={menuItem}
      icon={icon}
      warning={warning}
      title={title}
      disabled={disabled || setupBusy}
      destroying={destroying || setupDeletingDevice}
      onDelete={destroy}
      onCancel={onCancel}
    />
  )

  return disabled ? (
    <Tooltip
      key="deviceActions"
      placement="left"
      title={t('deleteDevice.mustBeOffline', 'Device must be offline')}
      open={device.state !== 'active' ? false : undefined}
      arrow
    >
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  )
}
