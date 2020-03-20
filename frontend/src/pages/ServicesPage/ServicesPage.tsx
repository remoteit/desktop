import React from 'react'
import { useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import { ServiceName } from '../../components/ServiceName'
import { ApplicationState } from '../../store'
import { Typography, Divider } from '@material-ui/core'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'
import { DataDisplay } from '../../components/DataDisplay'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'

const mapState = (state: ApplicationState, params: any) => ({
  connections: state.backend.connections,
  devices: state.devices.all,
})

export type ServicesPageProps = ReturnType<typeof mapState>

export const ServicesPage = connect(mapState)(({ connections, devices }: ServicesPageProps) => {
  const { deviceID } = useParams()
  const device = devices.find(d => d.id === deviceID)
  const activeConnection = connections.find(c => c.deviceID === deviceID && c.active)
  const serviceConnections = connections.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})

  if (!device) return <Typography variant="h1">No device found</Typography>

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <ConnectionStateIcon service={device} connection={activeConnection} size="lg" />
            <ServiceName
              service={device}
              connection={activeConnection}
              shared={device.shared === 'shared-from'}
              inline
            />
          </Typography>
        </>
      }
    >
      {/* <Typography variant="subtitle1">Services</Typography> */}
      <ServiceList services={device.services} connections={serviceConnections} />
      <Divider />
      <Typography variant="subtitle1">Device details</Typography>
      <Columns count={1} inset>
        <DataDisplay
          data={[
            { label: 'Device ID', value: device.id },
            { label: 'Hardware ID', value: device.hardwareID },
            { label: 'Internal IP', value: device.lastInternalIP },
            { label: 'External IP', value: device.lastExternalIP },
          ]}
        />
      </Columns>
    </Container>
  )
})
