import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { isRemoteUI } from '../helpers/uiHelper'
import { List } from '@material-ui/core'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
  device?: IDevice
}

export const DeviceEditPage: React.FC<Props> = ({ targetDevice, targets, device }) => {
  const history = useHistory()
  const remoteUI = useSelector((state: ApplicationState) => isRemoteUI(state))

  useEffect(() => {
    analyticsHelper.page('DeviceEditPage')
    // check that target device is registered and don't redirect
    if (!device && !(remoteUI && targetDevice.uid)) history.push('/devices')
  }, [device, targetDevice, history])

  if (!device) return null

  return (
    <DeviceHeaderMenu device={device}>
      <List>
        <DeviceNameSetting device={device} targetDevice={targetDevice} />
        {/* <DeviceLabelSetting device={device} /> */}
        {/* <SharedAccessSetting device={device} /> */}
        {/* {thisDevice && (
          <ListItemSetting
            label={targetDevice.disabled ? 'Device disabled' : 'Device enabled'}
            subLabel="Disabling your service will take it offline."
            icon="circle-check"
            toggle={!form.disabled}
            disabled={setupBusy}
            onClick={() => {
              setForm({ ...form, disabled: !form.disabled })
            }}
          />
        )} */}
      </List>
    </DeviceHeaderMenu>
  )
}
