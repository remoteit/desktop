import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { MAX_DESCRIPTION_LENGTH } from '../shared/constants'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'

export const DeviceDescriptionSetting: React.FC = () => {
  const { devices } = useDispatch<Dispatch>()
  const { device } = useContext(DeviceContext)

  if (!device) return null

  return (
    <InlineTextFieldSetting
      icon="paragraph"
      label="Device Description"
      value={device.attributes.description}
      disabled={!device.permissions.includes('MANAGE')}
      resetValue={device.attributes.description}
      maxLength={MAX_DESCRIPTION_LENGTH}
      onSave={description => {
        device.attributes = { ...device.attributes, description: description.toString() }
        devices.setAttributes(device)
      }}
    />
  )
}
