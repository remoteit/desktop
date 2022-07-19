import React from 'react'
import { Typography } from '@mui/material'
import { attributeName } from '../shared/nameHelper'
import { ListItemLocation } from './ListItemLocation'
import { RefreshButton } from '../buttons/RefreshButton'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { DeviceTagEditor } from './DeviceTagEditor'
import { ListHorizontal } from './ListHorizontal'
import { AddUserButton } from '../buttons/AddUserButton'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { UsersSelect } from './UsersSelect'
import { Container } from './Container'
import { Title } from './Title'

export const DeviceHeaderMenu: React.FC<{ device?: IDevice; header?: any; children?: React.ReactNode }> = ({
  device,
  header,
  children,
}) => {
  if (!device) return <UnauthorizedPage />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{attributeName(device) || 'Unknown'}</Title>
            <RefreshButton device={device} />
            <AddUserButton to={`/devices/${device.id}/share`} hide={!device.permissions.includes('MANAGE')} />
            <DeviceOptionMenu device={device} />
          </Typography>
          <DeviceTagEditor device={device} />
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
            <UsersSelect device={device} />
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
