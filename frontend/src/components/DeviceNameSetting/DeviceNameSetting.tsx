import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { safeHostname } from '../../shared/nameHelper'
import { attributeName } from '../../shared/nameHelper'

export const DeviceNameSetting: React.FC<{ device: IDevice; targetDevice: ITargetDevice }> = ({
  device,
  targetDevice,
}) => {
  const { devices } = useDispatch<Dispatch>()
  const { hostname, nameBlacklist } = useSelector((state: ApplicationState) => ({
    hostname: state.backend.environment.hostname,
    nameBlacklist: state.devices.all
      .filter((device: IDevice) => !device.shared)
      .map((d: IDevice) => d.name.toLowerCase()),
  }))

  if (!device) return null

  const name = attributeName(device)
  const defaultValue = device.id === targetDevice.uid ? safeHostname(hostname, nameBlacklist) : device.name

  return (
    <InlineTextFieldSetting
      value={name}
      label="Device Name"
      disabled={true} // disabled until we can support device renaming fully
      resetValue={defaultValue}
      onSave={name => {
        device.attributes = { ...device.attributes, name: name.toString() }
        devices.setAttributes(device)
        // if we use targetDevice instead of device attribute
        // emit('device', { ...device, name })
      }}
    />
  )
}
