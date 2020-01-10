import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
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
import { LanShareSelect } from '../../components/LanShareSelect'
import { ConnectionLog } from '../../components/ConnectionLog'
import { ConnectButton } from '../../buttons/ConnectButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ForgetButton } from '../../buttons/ForgetButton'
import { ErrorButton } from '../../buttons/ErrorButton'
import { DataDisplay } from '../../components/DataDisplay'
import { CopyButton } from '../../buttons/CopyButton'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { spacing } from '../../styling'

export const ServicePage: React.FC = () => {
  const css = useStyles()
  const { serviceID = '' } = useParams()
  const [showError, setShowError] = useState<boolean>(false)
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))

  let data: IDataDisplay[] = []

  if (!service || !device)
    return (
      <>
        <Typography variant="h1">
          <ConnectionStateIcon connection={connection} size="lg" />
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
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <ForgetButton connection={connection} />
            <LaunchButton connection={connection} service={service} />
            <CopyButton connection={connection} service={service} />
          </Typography>
          {showError && (
            <List className={css.errorMessage}>
              <ConnectionErrorMessage connection={connection} service={service} />
            </List>
          )}
        </>
      }
    >
      <ServiceConnected connection={connection} />
      <Columns>
        <List>
          <PortSetting connection={connection} service={service} />
          <HostSetting connection={connection} service={service} />
          <NameSetting connection={connection} service={service} />
          <UsernameSetting connection={connection} service={service} />
        </List>
        <div className={css.actions}>
          <ConnectButton connection={connection} service={service} fullSize />
        </div>
      </Columns>
      <Divider />
      <List>
        <LanShareSelect connection={connection} service={service} />
        <AutoStartSetting connection={connection} service={service} />
        <ConnectionLog connection={connection} />
      </List>
      <Divider />
      <Columns inset>
        <DataDisplay data={data} />
      </Columns>
    </Container>
  )
}

const useStyles = makeStyles({
  actions: { paddingTop: spacing.lg },
  errorMessage: { padding: 0 },
})
