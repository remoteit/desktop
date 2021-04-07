import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { isRemoteUI } from '../helpers/uiHelper'
import { TagEditor } from '../components/TagEditor'
import { Gutters } from '../components/Gutters'
import { List } from '@material-ui/core'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  targetDevice: ITargetDevice
  device?: IDevice
}

export const DeviceEditPage: React.FC<Props> = ({ targetDevice, device }) => {
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
        {/* <TagList device={device} /> */}
      </List>
      {/* <Gutters inset>
        <TagEditor device={device} />
      </Gutters> */}
    </DeviceHeaderMenu>
  )
}
