import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Dispatch, State } from '../store'
import { DeleteButton } from '../buttons/DeleteButton'

type Props = {
  device?: IDevice
  menuItem?: boolean
  hide?: boolean
}

export const LeaveDevice: React.FC<Props> = ({ device, menuItem, hide }) => {
  const { t } = useTranslation()
  const { devices } = useDispatch<Dispatch>()
  const { destroying } = useSelector((state: State) => state.ui)

  if (!device || hide || !device.shared) return null

  const leave = () => devices.leave(device)

  return (
    <DeleteButton
      menuItem={menuItem}
      icon="sign-out"
      title={t('leaveDevice.title', 'Leave Device')}
      warning={t(
        'leaveDevice.warning',
        'This device will have to be re-shared to you if you wish to access it again.'
      )}
      disabled={destroying}
      destroying={destroying}
      onDelete={leave}
    />
  )
}
