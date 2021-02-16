import React, { useState, useEffect } from 'react'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, List, Divider } from '@material-ui/core'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { ListItemLocation } from '../../components/ListItemLocation'
import { LicensingNotice } from '../../components/LicensingNotice'
import { LoadingMessage } from '../../components/LoadingMessage'
import { RefreshButton } from '../../buttons/RefreshButton'
import { selectService } from '../../models/devices'
import { ServiceName } from '../../components/ServiceName'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ServiceList } from '../../components/ServiceList'
import { UsersSelect } from '../../components/UsersSelect/UsersSelect'
import { EditButton } from '../../buttons/EditButton'
import { Container } from '../../components/Container'
import { Subtitle } from '../../components/Subtitle'
import { AddUserButton } from '../../buttons/AddUserButton'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServicesPage: React.FC = () => {
  const { deviceID } = useParams<{ deviceID: string }>()
  const { devices } = useDispatch<Dispatch>()
  const { connections, device, searched, query, thisDeviceId, fetching, access } = useSelector(
    (state: ApplicationState) => {
      const [_, device] = selectService(state, deviceID) // handles redirects that only have the service id
      return {
        device,
        connections: state.backend.connections,
        searched: state.devices.searched,
        query: state.devices.query,
        thisDeviceId: state.backend.device.uid,
        fetching: state.devices.fetching,
        access: state.accounts.access,
      }
    }
  )
  const [loaded, setLoaded] = useState<boolean>(false)
  const thisDevice = deviceID === thisDeviceId
  const history = useHistory()
  const location = useLocation()
  const connected = connections.find(c => c.deviceID === deviceID && c.connected)
  const serviceConnections = connections.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})

  useEffect(() => {
    analyticsHelper.page('ServicesPage')
    if (!device && !fetching) {
      if (loaded) history.push('/devices')
      else fetch()
    }
  }, [device, loaded, history])

  async function fetch() {
    await devices.fetchSingle({ deviceId: deviceID, hidden: true })
    setLoaded(true)
  }

  if (!device || fetching) return <LoadingMessage message="Fetching data..." />

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <ConnectionStateIcon device={device} connection={connected} thisDevice={thisDevice} size="lg" />
            <ServiceName device={device} connection={connected} inline />
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
        <UsersSelect device={device} access={access} />
        <ListItemLocation title="Device Details" icon="info-circle" pathname={location.pathname + '/details'} dense />
        <ListItemLocation title="Device Logs" icon="file-alt" pathname={location.pathname + '/logs'} dense />
      </List>
    </Container>
  )
}
