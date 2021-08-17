import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { DeleteButton } from './DeleteButton'

type Props = { device?: IDevice }

export const DeleteDeviceButton: React.FC<Props> = ({ device }) => {
  const { devices } = useDispatch<Dispatch>()
  const { destroying, userId } = useSelector((state: ApplicationState) => ({
    userId: state.auth.user?.id,
    destroying: state.devices.destroying,
  }))

  let disabled: boolean = false
  let icon: string = 'trash'
  let tooltip: string = 'Delete this device'
  let warning: string =
    "Deleting devices can't be undone so may require you to physically access the device if you wish to recover it."

  if (!device || device.accountId !== userId) return null

  if (device.state === 'active') {
    disabled = true
    tooltip = 'Device must be offline'
  }

  if (device.shared) {
    disabled = false
    icon = 'sign-out'
    tooltip = 'Leave Device'
    warning = 'This device will have to be re-shared to you if you wish to access it again.'
  }

  return (
    <DeleteButton
      icon={icon}
      warning={warning}
      tooltip={tooltip}
      disabled={disabled}
      destroying={destroying}
      onDelete={() => devices.destroy(device)}
    />
  )
}
