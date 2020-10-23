import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { replaceHost } from '../../shared/nameHelper'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
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
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { getAllDevices } from '../../models/accounts'
import { Breadcrumbs } from '../../components/Breadcrumbs'
// import { ListItemSetting } from '../../components/ListItemSetting'
import { AddServiceButton } from '../../buttons/AddServiceButton'
import { ListItemLocation } from '../../components/ListItemLocation'
import { ServiceMiniState } from '../../components/ServiceMiniState'
import { DeviceNameSetting } from '../../components/DeviceNameSetting'
import { AddFromNetworkButton } from '../../buttons/AddFromNetworkButton'
import { UnregisterDeviceButton } from '../../buttons/UnregisterDeviceButton'
import { LicensingNotice } from '../../components/LicensingNotice'
import { RefreshButton } from '../../buttons/RefreshButton'
import { DeleteButton } from '../../buttons/DeleteButton'
import { isRemoteUI } from '../../helpers/uiHelper'
import { getLinks } from '../../helpers/routeHelper'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { fontSizes } from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}

export const DeviceEditPage: React.FC<Props> = ({ targetDevice, targets }) => {
  const css = useStyles()
  const history = useHistory()
  const { deviceID } = useParams<{ deviceID: string }>()
  const { device, setupAddingService, links, remoteUI } = useSelector((state: ApplicationState) => ({
    device: getAllDevices(state).find((d: IDevice) => d.id === deviceID),
    setupAddingService: state.ui.setupAddingService,
    remoteUI: isRemoteUI(state),
    links: getLinks(state, deviceID),
  }))

  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
    // check that target device is registered and don't redirect
    if (!device && !(remoteUI && targetDevice.uid)) history.push(links.home)
  }, [device, targetDevice, history])

  if (!device) return null

  const thisDevice = device.id === targetDevice.uid

  function host(service: IService) {
    const target = targets.find(t => t.uid === service.id)
    if (target) return `${replaceHost(target.hostname)}:${target.port}`
  }

  // reverse sort services by creation date
  device.services.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <Container
      header={
        <>
          <OutOfBand />
          {remoteUI || <Breadcrumbs />}
          <Typography variant="h1">
            <Icon name="pen" size="lg" type="light" color="grayDarker" fixedWidth />
            <Title>Edit device</Title>
            {thisDevice ? <UnregisterDeviceButton targetDevice={targetDevice} /> : <DeleteButton device={device} />}
            <RefreshButton device={device} />
          </Typography>
        </>
      }
    >
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
      <Divider />
      {!device.shared && (
        <>
          <Typography variant="subtitle1">
            <Title>Services</Title>
            <AddFromNetworkButton device={device} thisDevice={thisDevice} link={links.scan} />
            <AddServiceButton device={device} thisDevice={thisDevice} link={links.add} />
          </Typography>
          <List>
            {thisDevice && <LicensingNotice device={device} />}
            {thisDevice && setupAddingService && (
              <ListItem disabled button dense>
                <ListItemIcon>
                  <CircularProgress color="inherit" size={fontSizes.md} />
                </ListItemIcon>
                <ListItemText primary="Registering..." />
              </ListItem>
            )}
            {device.services.map(s => (
              <ListItemLocation key={s.id} pathname={links.service.replace(':serviceID', s.id)} dense>
                <ListItemIcon></ListItemIcon>
                <ListItemText primary={s.name} secondary={host(s)} />
                <ListItemSecondaryAction className={css.actions}>
                  <ServiceMiniState service={s} />
                </ListItemSecondaryAction>
              </ListItemLocation>
            ))}
          </List>
        </>
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  actions: { right: 70 },
})
