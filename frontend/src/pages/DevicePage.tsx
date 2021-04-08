import React, { useEffect, useState } from 'react'
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
import { ServiceContextualMenu } from '../components/ServiceContextualMenu'
import { LicensingNotice } from '../components/LicensingNotice'
import { ServiceName } from '../components/ServiceName'
import { Notice } from '../components/Notice'
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
  const [contextMenu, setContextMenu] = useState<IContextMenu>({})
  const { connections, setupAddingService } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections.filter(c => c.deviceID === device?.id),
    setupAddingService: state.ui.setupAddingService,
  }))

  useEffect(() => {
    analyticsHelper.page('DevicePage')
  }, [])

  if (!device)
    return (
      <span>
        <Notice severity="warning">Device not found.</Notice>
      </span>
    )

  const thisDevice = device.id === targetDevice.uid
  const editable = thisDevice || device.configurable
  const connection = connections.find(c => c.deviceID === device.id && c.enabled)

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
            match={[
              `/devices/${device.id}/details`,
              `/devices/${device.id}/edit`,
              `/devices/${device.id}/users`,
              `/devices/${device.id}/logs`,
              `/devices/${device.id}`,
            ]}
            exactMatch
            dense
          >
            <ListItemIcon>
              <ConnectionStateIcon device={device} connection={connection} thisDevice={thisDevice} size="lg" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h2">
                  <ServiceName device={device} connection={connection} />
                </Typography>
              }
            />
          </ListItemLocation>
        </List>
      }
    >
      {device.state === 'inactive' && (
        <Notice severity="warning" gutterTop>
          Device offline
        </Notice>
      )}
      <Typography variant="subtitle1">
        <Title>Services</Title>
        <AddFromNetwork allowScanning={thisDevice} button />
        <AddServiceButton device={device} editable={editable} link={`/devices/${device.id}/add`} />
      </Typography>
      <List>
        {editable && <LicensingNotice device={device} />}
        {editable && setupAddingService && (
          <ListItem disabled dense>
            <ListItemText className={css.service} primary="Registering..." />
            <ListItemSecondaryAction>
              <CircularProgress color="primary" size={fontSizes.md} />
            </ListItemSecondaryAction>
          </ListItem>
        )}
        {device.services.map(s => (
          <ListItemLocation
            key={s.id}
            pathname={`/devices/${device.id}/${s.id}/details`}
            match={`/devices/${device.id}/${s.id}`}
            dense
          >
            <ListItemText
              className={css.service}
              primary={<ServiceName service={s} connection={connections.find(c => c.id === s.id)} />}
              secondary={host(s)}
            />
            <ListItemSecondaryAction>
              <ServiceMiniState
                service={s}
                connection={connections.find(c => c.id === s.id)}
                setContextMenu={setContextMenu}
              />
            </ListItemSecondaryAction>
          </ListItemLocation>
        ))}
      </List>
      <ServiceContextualMenu
        el={contextMenu.el}
        serviceID={contextMenu.serviceID}
        setEl={el => setContextMenu({ ...contextMenu, el })}
      />
    </Container>
  )
}

const useStyles = makeStyles({
  service: { marginLeft: spacing.sm },
})
