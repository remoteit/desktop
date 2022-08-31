import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { DeleteButton } from '../buttons/DeleteButton'

type Props = {
  device?: IDevice
  menuItem?: boolean
  hide?: boolean
}

export const LeaveDevice: React.FC<Props> = ({ device, menuItem, hide }) => {
  const { devices } = useDispatch<Dispatch>()
  const { destroying } = useSelector((state: ApplicationState) => state.ui)

  if (!device || hide || !device.shared) return null

  const leave = () => devices.leave(device)

  return (
    <DeleteButton
      menuItem={menuItem}
      icon="sign-out"
      title="Leave Device"
      warning="This device will have to be re-shared to you if you wish to access it again."
      disabled={destroying}
      destroying={destroying}
      onDelete={leave}
    />
  )
}
