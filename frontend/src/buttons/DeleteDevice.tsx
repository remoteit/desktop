import React from 'react'
import { emit } from '../services/Controller'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography } from '@material-ui/core'
import { DeleteButton } from './DeleteButton'
import { Notice } from '../components/Notice'

type Props = {
  device?: IDevice
  menuItem?: boolean
  onClick?: () => void
}

export const DeleteDevice: React.FC<Props> = ({ device, menuItem, onClick }) => {
  const { devices, ui } = useDispatch<Dispatch>()
  const { destroying, userId, setupBusy, setupDeletingDevice } = useSelector((state: ApplicationState) => ({
    userId: state.auth.user?.id,
    destroying: state.devices.destroying,
    setupBusy: state.ui.setupBusy,
    setupDeletingDevice: state.ui.setupDeletingDevice,
  }))

  let disabled: boolean = false
  let icon: string = 'trash'
  let title: string = 'Delete device'
  let warning: string | React.ReactElement = (
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

  if (!device || (device.accountId !== userId && !device.permissions.includes('MANAGE'))) return null

  const destroy = () => {
    if (device.thisDevice) {
      ui.set({ setupDeletingDevice: true, setupBusy: true })
      emit('device', 'DELETE')
    } else {
      devices.destroy(device)
    }
    onClick && onClick()
  }

  if (device.state === 'active') {
    disabled = true
    title = 'Device must be offline'
  }

  if (!device?.permissions.includes('MANAGE')) {
    disabled = false
    icon = 'sign-out'
    title = 'Leave Device'
    warning = 'This device will have to be re-shared to you if you wish to access it again.'
  }

  if (device.thisDevice) {
    disabled = false
    title = 'Unregister this device'
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
