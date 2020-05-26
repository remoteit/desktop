import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { ServiceName } from '../../components/ServiceName'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { DeleteButton } from '../../buttons/DeleteButton'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'
import { DataDisplay } from '../../components/DataDisplay'
import { Container } from '../../components/Container'
import { Duration } from '../../components/Duration'
import { Subtitle } from '../../components/Subtitle'
import { Columns } from '../../components/Columns'
import analytics from '../../helpers/Analytics'

export const ServicesPage: React.FC = () => {
  const { connections, devices, searched, query } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections,
    devices: state.devices.all,
    searched: state.devices.searched,
    query: state.devices.query,
  }))
  const { deviceID } = useParams()
  const history = useHistory()
  const device = devices.find((d: IDevice) => d.id === deviceID && !d.hidden)
  const activeConnection = connections.find(c => c.deviceID === deviceID && c.active)
  const serviceConnections = connections.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})

  useEffect(() => {
    analytics.page('ServicesPage')
    if (!device) history.push('/devices')
  }, [device, history])

  if (!device) return <Typography variant="h1">No device found</Typography>

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <ConnectionStateIcon service={device} connection={activeConnection} size="lg" />
            <ServiceName service={device} connection={activeConnection} shared={device.shared} inline />
            <DeleteButton device={device} />
          </Typography>
        </>
      }
    >
      {searched && <Subtitle primary="Services" secondary={`Searched for “${query}”`} />}
      <ServiceList services={device.services} connections={serviceConnections} />
      <Typography variant="subtitle1">Device details</Typography>
      <Columns count={1} inset>
        <DataDisplay
          data={[
            { label: 'Availability', value: availability(device.availability), help: 'Average time online per day' },
            { label: 'Instability', value: instability(device.instability), help: 'Average disconnects per day' },
            { label: 'Last reported', value: duration(device.lastReported) },
            { label: 'ISP', value: device.geo?.isp },
            { label: 'Connection type', value: device.geo?.connectionType },
            { label: 'Location', value: location(device.geo) },
            { label: 'External IP address', value: device.externalAddress },
            { label: 'Internal IP address', value: device.internalAddress },
            { label: 'Device ID', value: device.id },
            { label: 'Hardware ID', value: device.hardwareID },
          ]}
        />
      </Columns>
    </Container>
  )
}

function duration(date: Date) {
  if (date) return <Duration startTime={date.getTime()} ago />
}

function availability(value: number) {
  if (value) return Math.round(value) + '%'
}

function instability(value: number) {
  return Math.round(value * 10) / 10
}

function location(geo: IDevice['geo']) {
  if (!geo) return null
  return [geo.city, geo.stateName, geo.countryName].map(value => (
    <>
      {value}
      <br />
    </>
  ))
}
