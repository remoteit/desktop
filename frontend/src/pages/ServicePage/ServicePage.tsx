import React from 'react'
import { useParams } from 'react-router-dom'
import { ServiceSettings } from '../../components/ServiceSettings'
import { ServiceConnected } from '../../components/ServiceConnected'
import { useSelector } from 'react-redux'
import { findService } from '../../models/devices'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography } from '@material-ui/core'
import { ConnectionErrorMessage } from '../../components/ConnectionErrorMessage'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { DisconnectButton } from '../../components/DisconnectButton'
import { ConnectButton } from '../../components/ConnectButton'
import { LaunchButton } from '../../components/LaunchButton'
import { DataDisplay } from '../../components/DataDisplay'
import { CopyButton } from '../../components/CopyButton'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const ServicePage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const css = useStyles()

  if (!service || !device) return null

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="subtitle1">
            <ConnectionStateIcon connection={connection} service={service} size="lg" />
            <span className={css.title}>{service.name}</span>
            <LaunchButton connection={connection} />
            <CopyButton connection={connection} />
            <DisconnectButton connection={connection} />
            <ConnectButton connection={connection} service={service} />
          </Typography>
        </>
      }
    >
      {connection && <ConnectionErrorMessage connection={connection} />}
      {connection && connection.active && device && (
        <ServiceConnected connection={connection} device={device} service={service} />
      )}
      <ServiceSettings connection={connection} service={service} />
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
