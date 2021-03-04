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
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../components/Container'
// import { ListItemSetting } from '../../components/ListItemSetting'
import { AddServiceButton } from '../buttons/AddServiceButton'
import { ListItemLocation } from '../components/ListItemLocation'
import { ServiceMiniState } from '../components/ServiceMiniState'
import { AddFromNetwork } from '../components/AddFromNetwork'
import { ConnectionStateIcon } from '../components/ConnectionStateIcon'
import { LicensingNotice } from '../components/LicensingNotice'
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

export const DevicePage: React.FC<Props> = ({ targetDevice, targets, device }) => {
  const css = useStyles()
  const history = useHistory()
  const { connections, setupAddingService, links, remoteUI } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections.filter(c => c.deviceID === device?.id),
    setupAddingService: state.ui.setupAddingService,
    remoteUI: isRemoteUI(state),
    links: getLinks(state, device?.id),
  }))

  useEffect(() => {
    analyticsHelper.page('DevicePage')
    // check that target device is registered and don't redirect
    if (!device && !(remoteUI && targetDevice.uid)) history.push(links.home)
  }, [device, targetDevice, history])

  if (!device) return null

  const thisDevice = device.id === targetDevice.uid
  const editable = thisDevice || device.configurable
  const connected = connections.find(c => c.deviceID === device.id && c.connected)

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
          <ListItemLocation pathname={`/devices/${device.id}`} dense>
            <ListItemIcon>
              <ConnectionStateIcon device={device} connection={connected} thisDevice={thisDevice} size="lg" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h2">
                  <ServiceName device={device} connection={connected} inline />
                </Typography>
              }
            />
          </ListItemLocation>
        </>
      }
    >
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
    </Container>
  )
}

const useStyles = makeStyles({
  actions: { right: 70 },
})
