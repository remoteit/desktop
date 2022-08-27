import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { DeleteButton } from '../buttons/DeleteButton'

type Props = {
  device?: IDevice
  menuItem?: boolean
  hide?: boolean
  onClick?: () => void
}

export const LeaveDevice: React.FC<Props> = ({ device, menuItem, hide, onClick }) => {
  const { devices } = useDispatch<Dispatch>()
  const { destroying, setupBusy, setupDeletingDevice } = useSelector((state: ApplicationState) => ({
    destroying: state.ui.destroying,
    setupBusy: state.ui.setupBusy,
    setupDeletingDevice: state.ui.setupDeletingDevice,
  }))

  if (!device || hide || !device.shared) return null

  const leave = () => {
    devices.leave(device)
    onClick && onClick()
  }

  return (
    <DeleteButton
      menuItem={menuItem}
      icon="sign-out"
      title="Leave Device"
      warning="This device will have to be re-shared to you if you wish to access it again."
      disabled={setupBusy}
      destroying={destroying || setupDeletingDevice}
      onDelete={leave}
    />
  )
}
