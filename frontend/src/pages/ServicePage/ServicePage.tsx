import React, { useState } from 'react'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { ServiceSettings } from '../../components/ServiceSettings'
import { ServiceConnected } from '../../components/ServiceConnected'
import { useSelector } from 'react-redux'
import { findService } from '../../models/devices'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography } from '@material-ui/core'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { DisconnectButton } from '../../components/DisconnectButton'
import { ConnectButton } from '../../components/ConnectButton'
import { DataDisplay } from '../../components/DataDisplay'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const ServicePage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const css = useStyles()

  if (!service || !device) return null

  return (
    <Breadcrumbs>
      <Typography variant="subtitle1">
        <ConnectionStateIcon connection={connection} service={service} size="lg" />
        <span className={css.title}>{service.name}</span>
        <DisconnectButton connection={connection} />
        <ConnectButton connection={connection} service={service} />
      </Typography>
      {connection && connection.active && device && (
        <ServiceConnected connection={connection} device={device} service={service} />
      )}
      <ServiceSettings connection={connection} service={service} />
      <DataDisplay
        data={[
          { label: 'Owner', value: device.owner },
          { label: 'Device Name', value: device.name },
          { label: 'Service ID', value: service.id },
          { label: 'Application', value: service.type },
        ]}
      />
    </Breadcrumbs>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: spacing.md },
})
