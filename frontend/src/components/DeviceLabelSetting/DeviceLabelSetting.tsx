import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { LabelButton } from '../../buttons/LabelButton'

export const DeviceLabelSetting: React.FC<{ device: IDevice }> = ({ device }) => {
  const { devices } = useDispatch<Dispatch>()

  if (!device) return null

  return (
    <InlineTextFieldSetting
      label="Device Label"
      value={device.attributes.label}
      resetValue={device.attributes.label}
      icon={<LabelButton device={device} />}
      onSave={label => {
        device.attributes = { ...device.attributes, label: label.toString() }
        devices.setAttributes(device)
      }}
    />
  )
}
