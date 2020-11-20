import React, { useEffect } from 'react'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Typography, List, Divider } from '@material-ui/core'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { ListItemLocation } from '../../components/ListItemLocation'
import { LicensingNotice } from '../../components/LicensingNotice'
import { RefreshButton } from '../../buttons/RefreshButton'
import { ServiceName } from '../../components/ServiceName'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'
import { UsersSelect } from '../../components/UsersSelect/UsersSelect'
import { EditButton } from '../../buttons/EditButton'
import { selectDevice } from '../../models/devices'
import { Container } from '../../components/Container'
import { Subtitle } from '../../components/Subtitle'
import { AddUserButton } from '../../buttons/AddUserButton'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServicesPage: React.FC = () => {
  const { deviceID } = useParams<{ deviceID: string }>()
  const { connections, device, searched, query, thisDeviceId } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections,
    device: selectDevice(state, deviceID),
    searched: state.devices.searched,
    query: state.devices.query,
    thisDeviceId: state.backend.device.uid,
  }))
  const thisDevice = deviceID === thisDeviceId
  const history = useHistory()
  const location = useLocation()
  const activeConnection = connections.find(c => c.deviceID === deviceID && c.active)
  const serviceConnections = connections.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})

  useEffect(() => {
    analyticsHelper.page('ServicesPage')
    if (!device) history.push('/devices')
  }, [device, history])

  if (!device) return <Typography variant="h1">No device found</Typography>

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <ConnectionStateIcon device={device} connection={activeConnection} thisDevice={thisDevice} size="lg" />
            <ServiceName device={device} connection={activeConnection} inline />
            <EditButton device={device} />
            <AddUserButton device={device} />
            <RefreshButton device={device} />
          </Typography>
          <LicensingNotice device={device} />
        </>
      }
    >
      {searched && <Subtitle primary="Services" secondary={`Searched for “${query}”`} />}
      <ServiceList services={device.services} connections={serviceConnections} />
      <Divider />
      <List>
        <ListItemLocation title="Edit Device" icon="pen" pathname={location.pathname + '/edit'} dense />
        <UsersSelect device={device} />
        <ListItemLocation title="Device Details" icon="info-circle" pathname={location.pathname + '/details'} dense />
        <ListItemLocation title="Device Logs" icon="file-alt" pathname={location.pathname + '/logs'} dense />
      </List>
    </Container>
  )
}
