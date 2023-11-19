import React, { useContext } from 'react'
import { DeviceContext } from '../../services/Context'
import { MAX_NAME_LENGTH } from '@common/constants'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { safeHostname, attributeName } from '@common/nameHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { getDevices } from '../../selectors/devices'

export const DeviceNameSetting: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { device } = useContext(DeviceContext)
  const { hostname, nameBlacklist } = useSelector((state: ApplicationState) => ({
    hostname: state.backend.environment.hostname,
    nameBlacklist: getDevices(state)
      .filter((device: IDevice) => !device.shared)
      .map((d: IDevice) => d.name.toLowerCase()),
  }))

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
