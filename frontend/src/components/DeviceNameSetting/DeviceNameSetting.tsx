import React, { useContext } from 'react'
import { DeviceContext } from '../../services/Context'
import { State, Dispatch } from '../../store'
import { MAX_NAME_LENGTH } from '@common/constants'
import { useSelector, useDispatch } from 'react-redux'
import { safeHostname, attributeName } from '@common/nameHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { getDevices } from '../../selectors/devices'

export const DeviceNameSetting: React.FC = () => {
  const { device } = useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()
  const hostname = useSelector((state: State) => state.backend.environment.hostname)
  const nameBlacklist = useSelector(getDevices)
    .filter((device: IDevice) => !device.shared)
    .map((d: IDevice) => d.name.toLowerCase())

  if (!device) return null

  const name = attributeName(device)
  const defaultValue = device.thisDevice ? safeHostname(hostname, nameBlacklist) : device.name

  return (
    <InlineTextFieldSetting
      required
      value={name}
      icon="i-cursor"
      label="Device Name"
      disabled={!device.permissions.includes('MANAGE')}
      resetValue={defaultValue}
      maxLength={MAX_NAME_LENGTH}
      onSave={name => {
        dispatch.accounts.setDevice({ id: device.id, device: { ...device, name: name.toString() } })
        dispatch.devices.rename({ id: device.id, name: name.toString() })
      }}
    />
  )
}
