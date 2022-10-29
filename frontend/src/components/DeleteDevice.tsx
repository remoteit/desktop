import React from 'react'
import { emit } from '../services/Controller'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography } from '@mui/material'
import { DeleteButton } from '../buttons/DeleteButton'
import { Notice } from './Notice'

type Props = {
  device?: IDevice
  menuItem?: boolean
  hide?: boolean
  onClick?: () => void
}

export const DeleteDevice: React.FC<Props> = ({ device, menuItem, hide, onClick }) => {
  const { devices, ui } = useDispatch<Dispatch>()
  const { destroying, userId, setupBusy, setupDeletingDevice } = useSelector((state: ApplicationState) => ({
    userId: state.auth.user?.id,
    destroying: state.ui.destroying,
    setupBusy: state.ui.setupBusy,
    setupDeletingDevice: state.ui.setupDeletingDevice,
  }))

  let disabled: boolean = false
  let icon: string = 'trash'
  let title: string = 'Delete Device'
  let warning: React.ReactNode = (
    <>
      <Notice severity="danger" gutterBottom fullWidth>
        Deleting devices can't be undone so may require you to physically access the device if you wish to recover it.
      </Notice>
      <Typography variant="body2">
        We recommend uninstalling remote.it before <br />
        deleting devices.
      </Typography>
    </>
  )

  if (!device || hide || device.shared || (device.accountId !== userId && !device.permissions.includes('MANAGE')))
    return null

  const destroy = () => {
    if (device.thisDevice && device.owner.id === userId) {
      ui.set({ setupDeletingDevice: true, setupBusy: true, silent: device.id })
      emit('registration', 'DELETE')
    } else {
      devices.destroy(device)
    }
    onClick && onClick()
  }

  if (device.state === 'active') {
    disabled = true
    title = 'Device must be offline'
  }

  if (device.thisDevice && device.permissions.includes('MANAGE')) {
    disabled = false
    title = 'Unregister Device'
    warning = (
      <Notice severity="danger" fullWidth>
        You are about to permanently remove this device and all of its services.
      </Notice>
    )
  }

  return (
    <DeleteButton
      menuItem={menuItem}
      icon={icon}
      warning={warning}
      title={title}
      disabled={disabled || setupBusy}
      destroying={destroying || setupDeletingDevice}
      onDelete={destroy}
    />
  )
}
