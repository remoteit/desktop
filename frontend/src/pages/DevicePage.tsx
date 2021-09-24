import React, { useEffect } from 'react'
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
import { optionSortServices, SortServices } from '../components/SortServices'
import { ConnectionStateIcon } from '../components/ConnectionStateIcon'
import { ServiceContextualMenu } from '../components/ServiceContextualMenu'
import { LicensingNotice } from '../components/LicensingNotice'
import { ServiceName } from '../components/ServiceName'
import { GuideStep } from '../components/GuideStep'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { spacing, fontSizes } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  device?: IDevice
}

export const DevicePage: React.FC<Props> = ({ device }) => {
  const css = useStyles()
  const { connections, setupAddingService, sortService } = useSelector((state: ApplicationState) => ({
    connections: state.connections.all.filter(c => c.deviceID === device?.id),
    setupAddingService: state.ui.setupAddingService,
    sortService: state.devices.sortServiceOption,
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

  const editable = device.thisDevice || device.configurable
  const connection = connections.find(c => c.deviceID === device.id && c.enabled)

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
              <ConnectionStateIcon device={device} connection={connection} size="lg" />
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
        <SortServices />
        <AddFromNetwork allowScanning={device.thisDevice} button />
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
        {device.services.sort(optionSortServices[`${sortService}`].sortService).map(s => (
          <GuideStep
            key={s.id}
            guide="guideAWS"
            step={4}
            instructions="Select the service below."
            hide={!s.name.includes('Start here')}
            highlight
            autoNext
          >
            <ListItemLocation
              pathname={`/devices/${device.id}/${s.id}/details`}
              match={`/devices/${device.id}/${s.id}`}
              dense
            >
              <ListItemText
                className={css.service}
                primary={<ServiceName service={s} connection={connections.find(c => c.id === s.id)} />}
              />
              <ListItemSecondaryAction>
                <ServiceMiniState service={s} connection={connections.find(c => c.id === s.id)} />
              </ListItemSecondaryAction>
            </ListItemLocation>
          </GuideStep>
        ))}
      </List>
      <ServiceContextualMenu />
    </Container>
  )
}

const useStyles = makeStyles({
  service: { marginLeft: spacing.sm },
})
