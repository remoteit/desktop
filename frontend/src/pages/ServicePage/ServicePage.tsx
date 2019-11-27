import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { PortSetting } from '../../components/PortSetting'
import { HostSetting } from '../../components/HostSetting'
import { NameSetting } from '../../components/NameSetting'
import { findService } from '../../models/devices'
import { ServiceName } from '../../components/ServiceName'
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

export const ServicePage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const css = useStyles()
  let data: IDataDisplay[] = []

  if (!service || !device)
    return (
      <>
        <Typography variant="h1">
          <ConnectionStateIcon connection={connection} size="lg" />
          <ServiceName connection={connection} />
          <ForgetButton connection={connection} />
        </Typography>
        <section>
          {connection && (
            <Typography variant="caption">Device may have been removed ({connection.deviceID})</Typography>
          )}
        </section>
      </>
    )

  if (connection && connection.active) {
    data = data.concat([
      { label: 'Host', value: connection.host },
      { label: 'Port', value: connection.port },
      { label: 'Restriction', value: connection.restriction },
    ])
  }

  data = data.concat([
    { label: 'Service Name', value: service.name },
    { label: 'Device Name', value: device.name },
    { label: 'Owner', value: device.owner },
    { label: 'Service Type', value: service.type },
    { label: 'Service ID', value: service.id },
  ])

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <ConnectionStateIcon connection={connection} service={service} size="lg" />
            <ServiceName connection={connection} service={service} inline />
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
      {connection && connection.active && (
        <>
          <ServiceConnected connection={connection} />
          <Divider />
        </>
      )}
      <List>
        <PortSetting connection={connection} service={service} />
        <HostSetting connection={connection} service={service} />
        <NameSetting connection={connection} service={service} />
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
        <DataDisplay data={data} />
      </Columns>
    </Container>
  )
}

const useStyles = makeStyles({})
