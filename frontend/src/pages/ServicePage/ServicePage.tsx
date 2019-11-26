import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { PortSetting } from '../../components/PortSetting'
import { HostSetting } from '../../components/HostSetting'
import { NameSetting } from '../../components/NameSetting'
import { findService } from '../../models/devices'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { UsernameSetting } from '../../components/UsernameSetting'
import { AutoStartSetting } from '../../components/AutoStartSetting'
import { ServiceConnected } from '../../components/ServiceConnected'
import { ApplicationState } from '../../store'
import { Typography, Divider, List } from '@material-ui/core'
import { ConnectionErrorMessage } from '../../components/ConnectionErrorMessage'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { DisconnectButton } from '../../components/DisconnectButton'
import { LanShareSelect } from '../../components/LanShareSelect'
import { ConnectButton } from '../../components/ConnectButton'
import { BrowserButton } from '../../components/BrowserButton'
import { ForgetButton } from '../../components/ForgetButton'
import { DataDisplay } from '../../components/DataDisplay'
import { CopyButton } from '../../components/CopyButton'
import { SSHButton } from '../../components/SSHButton'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const ServicePage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const css = useStyles()

  if (!service || !device)
    return (
      <>
        <Typography variant="h1">
          <ConnectionStateIcon connection={connection} size="lg" />
          <span className={css.title}>No device found.</span>
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
            <ConnectionStateIcon connection={connection} service={service} size="lg" />
            <span className={css.title}>{service.name}</span>
            <ForgetButton connection={connection} />
            <BrowserButton connection={connection} />
            <SSHButton connection={connection} service={service} />
            <CopyButton connection={connection} />
            <DisconnectButton connection={connection} />
            <ConnectButton connection={connection} service={service} />
          </Typography>
        </>
      }
    >
      {connection && <ConnectionErrorMessage connection={connection} />}
      {connection && connection.active && device && (
        <>
          <ServiceConnected connection={connection} device={device} service={service} />
          <Divider />
        </>
      )}
      <List>
        <NameSetting connection={connection} service={service} />
        <PortSetting connection={connection} service={service} />
        <HostSetting connection={connection} service={service} />
        <UsernameSetting connection={connection} service={service} />
      </List>
      <Divider />
      <List>
        <AutoStartSetting connection={connection} service={service} />
      </List>
      <Divider />
      <List>
        <LanShareSelect connection={connection} service={service} />
      </List>
      <Divider />
      <Columns>
        <DataDisplay
          data={[
            { label: 'Owner', value: device.owner },
            { label: 'Device Name', value: device.name },
            { label: 'Service ID', value: service.id },
            { label: 'Application', value: service.type },
          ]}
        />
      </Columns>
    </Container>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: spacing.md },
})
