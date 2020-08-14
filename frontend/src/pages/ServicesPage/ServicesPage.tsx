import React, { useEffect } from 'react'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { Typography, List, Divider } from '@material-ui/core'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { ListItemLocation } from '../../components/ListItemLocation'
import { RefreshButton } from '../../buttons/RefreshButton'
import { DeleteButton } from '../../buttons/DeleteButton'
import { ServiceName } from '../../components/ServiceName'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'
import { UsersSelect } from '../../components/UsersSelect/UsersSelect'
import { Container } from '../../components/Container'
import { Subtitle } from '../../components/Subtitle'
import analytics from '../../helpers/Analytics'

export const ServicesPage: React.FC = () => {
  const { connections, devices, searched, query, thisDeviceId } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections,
    devices: state.devices.all,
    searched: state.devices.searched,
    query: state.devices.query,
    thisDeviceId: state.backend.device.uid,
  }))
  const { deviceID } = useParams()
  const thisDevice = deviceID === thisDeviceId
  const history = useHistory()
  const location = useLocation()
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
            <ConnectionStateIcon service={device} connection={activeConnection} thisDevice={thisDevice} size="lg" />
            <ServiceName service={device} connection={activeConnection} shared={device.shared} inline />
            <RefreshButton device={device} />
            <DeleteButton device={device} />
          </Typography>
        </>
      }
      footer={
        <>
          <Divider />
          <List>
            <UsersSelect device={device} />
            <ListItemLocation title="Device Details" icon="info-circle" pathname={location.pathname + '/details'} />
            {thisDevice && <ListItemLocation title="Edit Device" icon="pen" pathname={location.pathname + '/edit'} />}
          </List>
        </>
      }
    >
      {searched && <Subtitle primary="Services" secondary={`Searched for “${query}”`} />}
      <ServiceList services={device.services} connections={serviceConnections} />
    </Container>
  )
}
