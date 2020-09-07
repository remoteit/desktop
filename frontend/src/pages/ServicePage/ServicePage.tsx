import React, { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import { PortSetting } from '../../components/PortSetting'
import { HostSetting } from '../../components/HostSetting'
import { NameSetting } from '../../components/NameSetting'
import { findService } from '../../models/devices'
import { ServiceName } from '../../components/ServiceName'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ProxySetting } from '../../components/ProxySetting'
import { UsernameSetting } from '../../components/UsernameSetting'
import { ListItemLocation } from '../../components/ListItemLocation'
import { ServiceConnected } from '../../components/ServiceConnected'
import { ApplicationState } from '../../store'
import { AutoStartSetting } from '../../components/AutoStartSetting'
import { Typography, Divider, List } from '@material-ui/core'
import { ConnectionErrorMessage } from '../../components/ConnectionErrorMessage'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { LanShareSelect } from '../../components/LanShareSelect'
import { LaunchSetting } from '../../components/LaunchSetting'
import { AddUserButton } from '../../buttons/AddUserButton'
import { ConnectButton } from '../../buttons/ConnectButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ForgetButton } from '../../buttons/ForgetButton'
import { UsersSelect } from '../../components/UsersSelect'
import { ErrorButton } from '../../buttons/ErrorButton'
import { CopyButton } from '../../buttons/CopyButton'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { spacing } from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServicePage: React.FC = () => {
  const css = useStyles()
  const location = useLocation()
  const { serviceID = '' } = useParams()
  const [showError, setShowError] = useState<boolean>(false)
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const thisDevice = useSelector((state: ApplicationState) => state.backend.device?.uid) === device?.id

  useEffect(() => {
    analyticsHelper.page('ServicePage')
  }, [])

  if (!service || !device)
    return (
      <>
        <Typography variant="h1">
          <ConnectionStateIcon connection={connection} thisDevice={thisDevice} size="lg" />
          <ServiceName connection={connection} inline />
          <ForgetButton connection={connection} />
        </Typography>
        <section>
          {connection && (
            <Typography variant="caption">Device may have been removed ({connection.deviceID})</Typography>
          )}
        </section>
      </>
    )

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <ConnectionStateIcon connection={connection} service={service} thisDevice={thisDevice} size="lg" />
            <ServiceName connection={connection} service={service} inline />
            <AddUserButton device={device} />
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <ForgetButton connection={connection} />
            <LaunchButton connection={connection} service={service} />
            <CopyButton connection={connection} service={service} />
          </Typography>
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
        </>
      }
    >
      <ServiceConnected connection={connection} service={service} />
      <Columns center>
        <List>
          <NameSetting connection={connection} service={service} />
          <UsernameSetting connection={connection} service={service} />
          <PortSetting connection={connection} service={service} />
          <HostSetting connection={connection} service={service} />
          <LaunchSetting connection={connection} service={service} />
        </List>
        <div className={css.actions}>
          <ConnectButton
            connection={connection}
            service={service}
            autoConnect={location.state?.autoConnect}
            size="medium"
          />
        </div>
      </Columns>
      <Divider />
      <List>
        <ProxySetting connection={connection} service={service} />
        <AutoStartSetting connection={connection} service={service} />
        <LanShareSelect connection={connection} service={service} />
      </List>
      <Divider />
      <List>
        <ListItemLocation title="Edit Service" icon="pen" pathname={location.pathname + '/edit'} dense />
        <UsersSelect service={service} device={device} />
        <ListItemLocation title="Service Details" icon="info-circle" pathname={location.pathname + '/details'} dense />
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  actions: {
    marginRight: spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessage: { padding: 0 },
})
