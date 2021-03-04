import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { replaceHost } from '../shared/nameHelper'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import {
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../components/Container'
import { AddServiceButton } from '../buttons/AddServiceButton'
import { ListItemLocation } from '../components/ListItemLocation'
import { ServiceMiniState } from '../components/ServiceMiniState'
import { AddFromNetwork } from '../components/AddFromNetwork'
import { ConnectionStateIcon } from '../components/ConnectionStateIcon'
import { LicensingNotice } from '../components/LicensingNotice'
import { ServiceName } from '../components/ServiceName'
import { isRemoteUI } from '../helpers/uiHelper'
import { Title } from '../components/Title'
import { spacing, fontSizes } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
  device?: IDevice
}

export const DevicePage: React.FC<Props> = ({ targetDevice, targets, device }) => {
  const css = useStyles()
  const history = useHistory()
  const { connections, setupAddingService, remoteUI } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections.filter(c => c.deviceID === device?.id),
    setupAddingService: state.ui.setupAddingService,
    remoteUI: isRemoteUI(state),
  }))

  useEffect(() => {
    analyticsHelper.page('DevicePage')
    // check that target device is registered and don't redirect
    if (!device && !(remoteUI && targetDevice.uid)) history.push('/devices')
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
        <List>
          <ListItemLocation
            pathname={`/devices/${device.id}/details`}
            selected={[
              `/devices/${device.id}/details`,
              `/devices/${device.id}/edit`,
              `/devices/${device.id}/users`,
              `/devices/${device.id}/logs`,
            ]}
            dense
          >
            <ListItemIcon>
              <ConnectionStateIcon device={device} connection={connected} thisDevice={thisDevice} size="lg" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h2">
                  <ServiceName device={device} connection={connected} />
                </Typography>
              }
            />
          </ListItemLocation>
        </List>
      }
    >
      <Typography variant="subtitle1">
        <Title>Services</Title>
        <AddFromNetwork allowScanning={thisDevice} button />
        <AddServiceButton device={device} editable={editable} link="/devices/:deviceID/add" />
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
          <ListItemLocation
            key={s.id}
            pathname={`/devices/${device.id}/${s.id}/details`}
            selected={`/devices/${device.id}/${s.id}`}
            dense
          >
            <ListItemText className={css.service} primary={s.name} secondary={host(s)} />
            <ListItemSecondaryAction>
              <ServiceMiniState service={s} connection={connections.find(c => c.id === s.id)} />
            </ListItemSecondaryAction>
          </ListItemLocation>
        ))}
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  service: { marginLeft: spacing.sm },
})
