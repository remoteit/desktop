import React from 'react'
import { useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Typography } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'
import { DataDisplay } from '../../components/DataDisplay'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'

const mapState = (state: ApplicationState, params: any) => ({
  connections: state.backend.connections,
  devices: state.devices.all,
})

export type ServicesPageProps = ReturnType<typeof mapState>

export const ServicesPage = connect(mapState)(({ connections, devices }: ServicesPageProps) => {
  const css = useStyles()
  const { deviceID } = useParams()
  const device = devices.find(d => d.id === deviceID)
  const activeConnection = connections.find(c => c.deviceID === deviceID && c.active)
  const serviceConnections = connections.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})

  if (!device) return <Typography variant="subtitle1">No device found.</Typography>

  return (
    <Breadcrumbs>
      <Typography variant="subtitle1">
        <ConnectionStateIcon state={device.state} connection={activeConnection} size="lg" />
        <span className={css.title}>{device.name}</span>
      </Typography>
      <ServiceList services={device.services} connections={serviceConnections} />
      <DataDisplay
        data={[
          { label: 'Device ID', value: device.id },
          { label: 'Hardware ID', value: device.hardwareID },
          { label: 'Internal IP', value: device.lastInternalIP },
          { label: 'External IP', value: device.lastExternalIP },
        ]}
      />
    </Breadcrumbs>
  )
})

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: styles.spacing.md },
})
