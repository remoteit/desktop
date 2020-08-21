import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { SettingsListItem } from '../ListItemSetting'

export const SharedAccessSetting: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { devices } = useDispatch<Dispatch>()

  if (!device || device.shared) return null

  return (
    <SettingsListItem
      label="Disable shared access"
      subLabel="While active, no other users will be able to connect to this device."
      icon="user-shield"
      toggle={!!device.attributes.accessDisabled}
      onClick={() => {
        device.attributes = { ...device.attributes, accessDisabled: !device.attributes.accessDisabled }
        devices.setAttributes(device)
      }}
    />
  )
}
