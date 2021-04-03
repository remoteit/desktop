import React from 'react'
import { Route } from 'react-router-dom'
import { Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ListItemLocation } from './ListItemLocation'
import { RefreshButton } from '../buttons/RefreshButton'
import { ApplicationState } from '../store'
import { UnregisterDeviceButton } from '../buttons/UnregisterDeviceButton'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { ListHorizontal } from './ListHorizontal'
import { AddUserButton } from '../buttons/AddUserButton'
import { DeleteButton } from '../buttons/DeleteButton'
import { UsersSelect } from './UsersSelect'
import { Container } from './Container'
import { Title } from './Title'

export const DeviceHeaderMenu: React.FC<{ device?: IDevice }> = ({ device, children }) => {
  const { thisDevice, access } = useSelector((state: ApplicationState) => {
    return {
      thisDevice: state.backend.device?.uid === device?.id,
      fetching: state.devices.fetching,
      access: state.accounts.access,
    }
  })

  if (!device) return <UnauthorizedPage />

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            {/* <ConnectionStateIcon device={device} connection={connected} thisDevice={thisDevice} size="lg" /> */}
            <Title>{device.name || 'Unknown'}</Title>
            {/* <ServiceName device={device} connection={connected} /> */}
            <Route path="/devices/:deviceID/edit">
              {thisDevice ? <UnregisterDeviceButton device={device} /> : <DeleteButton device={device} />}
            </Route>
            <RefreshButton device={device} />
            <AddUserButton to={`/devices/${device.id}/share`} />
          </Typography>
          <ListHorizontal>
            <ListItemLocation
              title="Details"
              icon="info-circle"
              iconColor="grayDarker"
              pathname={`/devices/${device.id}/details`}
              match={[`/devices/${device.id}`, `/devices/${device.id}/details`]}
              exactMatch
              dense
            />
            <ListItemLocation
              title="Edit"
              icon="pen"
              iconColor="grayDarker"
              pathname={`/devices/${device.id}/edit`}
              dense
            />
            <UsersSelect device={device} access={access} />
            <ListItemLocation
              title="Logs"
              icon="file-alt"
              iconColor="grayDarker"
              pathname={`/devices/${device.id}/logs`}
              dense
            />
          </ListHorizontal>
        </>
      }
    >
      {children}
    </Container>
  )
}
