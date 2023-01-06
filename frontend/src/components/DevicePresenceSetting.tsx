import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { TestUI } from './TestUI'

export const DevicePresenceSetting: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { device } = useContext(DeviceContext)

  if (!device) return null

  return (
    <TestUI>
      <InlineTextFieldSetting
        icon="bullseye-pointer"
        label="Presence Address"
        placeholder="Example: prod-presence.remote.it:6960"
        value={device.presenceAddress}
        disabled={!device.permissions.includes('MANAGE')}
        resetValue={device.presenceAddress}
        onSave={value =>
          dispatch.devices.cloudUpdateDevice({ id: device.id, set: { presenceAddress: value.toString() } })
        }
      />
    </TestUI>
  )
}
