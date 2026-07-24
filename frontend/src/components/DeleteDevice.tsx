import React from 'react'
import { emit } from '../services/Controller'
import { Tooltip } from '@mui/material'
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
      devices.destroy(device)
    }
    onClick && onClick()
  }

  if (device.state === 'active') disabled = true

  if (device.thisDevice && device.permissions.includes('MANAGE')) {
    disabled = false
    title = t('deleteDevice.unregisterTitle', 'Unregister Device')
    warning = (
      <Notice severity="error" fullWidth>
        {t('deleteDevice.unregisterWarning', 'You are about to permanently remove this device and all of its services.')}
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
