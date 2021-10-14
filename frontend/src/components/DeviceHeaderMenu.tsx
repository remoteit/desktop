import React from 'react'
import { Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { attributeName } from '../shared/nameHelper'
import { ListItemLocation } from './ListItemLocation'
import { RefreshButton } from '../buttons/RefreshButton'
import { ApplicationState } from '../store'
import { UnregisterDeviceButton } from '../buttons/UnregisterDeviceButton'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { ListHorizontal } from './ListHorizontal'
import { AddUserButton } from '../buttons/AddUserButton'
import { DeleteDeviceButton } from '../buttons/DeleteDeviceButton'
import { UsersSelect } from './UsersSelect'
import { Container } from './Container'
import { Title } from './Title'

export const DeviceHeaderMenu: React.FC<{ device?: IDevice; header?: any }> = ({ device, header, children }) => {
  const access = useSelector((state: ApplicationState) => state.organization.members.map(m => m.user))

  if (!device) return <UnauthorizedPage />

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>{attributeName(device) || 'Unknown'}</Title>
            {device.thisDevice ? <UnregisterDeviceButton device={device} /> : <DeleteDeviceButton device={device} />}
            <RefreshButton device={device} />
            <AddUserButton to={`/devices/${device.id}/share`} hide={device.shared} />
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
              disabled={device.state === 'inactive'}
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
          {header}
        </>
      }
    >
      {children}
    </Container>
  )
}
