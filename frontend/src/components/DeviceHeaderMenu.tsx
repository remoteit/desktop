import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { Typography } from '@mui/material'
import { attributeName } from '../shared/nameHelper'
import { ListItemLocation } from './ListItemLocation'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { DeviceTagEditor } from './DeviceTagEditor'
import { ListHorizontal } from './ListHorizontal'
import { DeviceConnectMenu } from './DeviceConnectMenu'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { UsersSelect } from './UsersSelect'
import { Container } from './Container'
import { Title } from './Title'

export const DeviceHeaderMenu: React.FC<{ header?: any; children?: React.ReactNode }> = ({ header, children }) => {
  const { device } = useContext(DeviceContext)
  if (!device) return <UnauthorizedPage />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{attributeName(device) || 'Unknown'}</Title>
            <DeviceConnectMenu size="small" />
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
