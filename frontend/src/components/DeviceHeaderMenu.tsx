import React from 'react'
import { useSelector } from 'react-redux'
import { ListItemLocation } from './ListItemLocation'
import { RefreshButton } from '../buttons/RefreshButton'
import { ApplicationState } from '../store'
import { Typography } from '@material-ui/core'
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
            <RefreshButton device={device} />
            <AddUserButton to={`/devices/${device.id}/share`} />
            {thisDevice ? <UnregisterDeviceButton device={device} /> : <DeleteButton device={device} />}
          </Typography>
          <ListHorizontal>
            <ListItemLocation
              title="Device Details"
              icon="info-circle"
              pathname={`/devices/${device.id}/details`}
              dense
            />
            <ListItemLocation title="Edit Device" icon="pen" pathname={`/devices/${device.id}/edit`} dense />
            <UsersSelect device={device} access={access} />
            <ListItemLocation title="Device Logs" icon="file-alt" pathname={`/devices/${device.id}/logs`} dense />
          </ListHorizontal>
        </>
      }
    >
      {children}
    </Container>
  )
}
