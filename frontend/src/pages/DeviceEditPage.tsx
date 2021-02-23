import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { replaceHost } from '../shared/nameHelper'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import {
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../components/Container'
import { OutOfBand } from '../components/OutOfBand'
import { getAllDevices } from '../models/accounts'
import { Breadcrumbs } from '../components/Breadcrumbs'
// import { ListItemSetting } from '../../components/ListItemSetting'
import { AddServiceButton } from '../buttons/AddServiceButton'
import { ListItemLocation } from '../components/ListItemLocation'
import { ServiceMiniState } from '../components/ServiceMiniState'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { AddFromNetwork } from '../components/AddFromNetwork'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { UnregisterDeviceButton } from '../buttons/UnregisterDeviceButton'
import { AdminPanelConnect } from '../components/AdminPanelConnect'
import { LicensingNotice } from '../components/LicensingNotice'
import { RefreshButton } from '../buttons/RefreshButton'
import { AddUserButton } from '../buttons/AddUserButton'
import { DeleteButton } from '../buttons/DeleteButton'
import { UsersSelect } from '../components/UsersSelect'
import { ServiceName } from '../components/ServiceName'
import { isRemoteUI } from '../helpers/uiHelper'
import { getLinks } from '../helpers/routeHelper'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { fontSizes } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
  device?: IDevice
}

export const DeviceEditPage: React.FC<Props> = ({ targetDevice, targets, device }) => {
  const css = useStyles()
  const history = useHistory()
  const { links, remoteUI } = useSelector((state: ApplicationState) => ({
    remoteUI: isRemoteUI(state),
    links: getLinks(state, device?.id),
  }))

  useEffect(() => {
    analyticsHelper.page('DeviceEditPage')
    // check that target device is registered and don't redirect
    if (!device && !(remoteUI && targetDevice.uid)) history.push(links.home)
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

const useStyles = makeStyles({
  // actions: { right: 70 },
})
