import React, { useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { ServiceName } from '../../components/ServiceName'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { Typography, List } from '@material-ui/core'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { RefreshButton } from '../../buttons/RefreshButton'
import { DeleteButton } from '../../buttons/DeleteButton'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'
import { DataDisplay } from '../../components/DataDisplay'
import { Container } from '../../components/Container'
import { Subtitle } from '../../components/Subtitle'
import { Columns } from '../../components/Columns'
import analytics from '../../helpers/Analytics'
import { DeviceActionListItem } from '../ServicePage/ServicePage'
import { UsersSelect } from '../../components/UsersSelect/UsersSelect'

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

  const actions: ActionType[] = [
    { title: 'Shared Users', icon: 'user-friends', pathname: '/service/setup' },
    { title: 'Edit Device', icon: 'pen', pathname: `/deviceEdit/${deviceID}` },
    { title: 'Device Details', icon: 'info-circle', pathname: `/deviceDetail/${deviceID}` },
  ]

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
            <RefreshButton device={device} />
            <DeleteButton device={device} />
          </Typography>
        </>
      }
    >
      {searched && <Subtitle primary="Services" secondary={`Searched for “${query}”`} />}
      <ServiceList services={device.services} connections={serviceConnections} />
      <List>
        {actions.map(action => {
          return <DeviceActionListItem title={action.title} icon={action.icon} pathname={action.pathname} />
        })}
      </List>
      <UsersSelect device={device} />
    </Container>
  )
}
