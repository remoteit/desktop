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
import { AddFromNetwork } from '../../components/AddFromNetwork'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { UnregisterDeviceButton } from '../../buttons/UnregisterDeviceButton'
import { AdminPanelConnect } from '../../components/AdminPanelConnect'
import { LicensingNotice } from '../../components/LicensingNotice'
import { RefreshButton } from '../../buttons/RefreshButton'
import { AddUserButton } from '../../buttons/AddUserButton'
import { DeleteButton } from '../../buttons/DeleteButton'
import { UsersSelect } from '../../components/UsersSelect'
import { ServiceName } from '../../components/ServiceName'
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
  const { device, connections, setupAddingService, links, remoteUI, access } = useSelector(
    (state: ApplicationState) => {
      const device = getAllDevices(state).find((d: IDevice) => d.id === deviceID)
      return {
        device,
        connections: state.backend.connections.filter(c => c.deviceID === deviceID),
        setupAddingService: state.ui.setupAddingService,
        remoteUI: isRemoteUI(state),
        links: getLinks(state, deviceID),
        access: state.accounts.access,
      }
    }
  )

  // useEffect(() => {
  //   analyticsHelper.page('ServicesPage')
  //   if (!device && !fetching) {
  //     if (loaded) history.push('/devices')
  //     else fetch()
  //   }
  // }, [device, loaded, history])

  // async function fetch() {
  //   await devices.fetchSingle({ deviceId: deviceID, hidden: true })
  //   setLoaded(true)
  // }

  // if (!device || fetching) return <LoadingMessage message="Fetching data..." />

  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
    // check that target device is registered and don't redirect
    if (!device && !(remoteUI && targetDevice.uid)) history.push(links.home)
  }, [device, targetDevice, history])

  if (!device) return null

  const thisDevice = device.id === targetDevice.uid
  const editable = thisDevice || device.configurable
  const connected = connections.find(c => c.deviceID === deviceID && c.connected)

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
            <ConnectionStateIcon device={device} connection={connected} thisDevice={thisDevice} size="lg" />
            <ServiceName device={device} connection={connected} inline />
            {thisDevice ? <UnregisterDeviceButton device={device} /> : <DeleteButton device={device} />}
            <AddUserButton device={device} />
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
      {!editable && <AdminPanelConnect device={device} connections={connections} />}
      {!device.shared && (
        <>
          <Typography variant="subtitle1">
            <Title>Services</Title>
            <AddFromNetwork allowScanning={thisDevice} button />
            <AddServiceButton device={device} editable={editable} link={links.add} />
          </Typography>
          <List>
            {editable && <LicensingNotice device={device} />}
            {editable && setupAddingService && (
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
                  <ServiceMiniState service={s} connection={connections.find(c => c.id === s.id)} />
                </ListItemSecondaryAction>
              </ListItemLocation>
            ))}
          </List>
        </>
      )}
      <Divider />
      <List>
        <UsersSelect device={device} access={access} />
        <ListItemLocation title="Device Details" icon="info-circle" pathname={`/devices/${deviceID}/details`} dense />
        <ListItemLocation title="Device Logs" icon="file-alt" pathname={`/devices/${deviceID}/logs`} dense />
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  actions: { right: 70 },
})
