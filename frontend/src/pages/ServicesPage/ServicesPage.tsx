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
  }, [device])

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
            { label: 'Availability', value: percent(device.availability) },
            { label: 'Instability', value: percent(device.instability) },
            { label: 'Location', value: location(device.geo) },
            { label: 'ISP', value: device.geo?.isp },
            { label: 'Last reported', value: duration(device.lastReported) },
            { label: 'External IP address', value: device.externalAddress },
            { label: 'Internal IP address', value: device.internalAddress },
            { label: 'Server IP address', value: device.serverAddress },
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

function percent(value: number) {
  if (value) return Math.round(value) + '%'
}

function location(geo: IDevice['geo']) {
  if (!geo) return null
  let loc = isNaN(+geo.state) ? geo.state + ' ' : ''
  return loc + geo.country
}
