import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { Typography } from '@mui/material'
import { attributeName } from '../shared/nameHelper'
import { ListItemLocation } from './ListItemLocation'
import { LoadingMessage } from './LoadingMessage'
import { ListHorizontal } from './ListHorizontal'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { AddUserButton } from '../buttons/AddUserButton'
import { UsersTab } from './UsersTab'
import { Container } from './Container'
import { Gutters } from './Gutters'
import { Title } from './Title'

export const DeviceHeaderMenu: React.FC<{ header?: any; children?: React.ReactNode }> = ({ header, children }) => {
  const { device } = useContext(DeviceContext)

  if (!device) return <LoadingMessage />

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{attributeName(device) || 'Unknown'}</Title>
            <AddUserButton
              to={`/devices/${device.id}/share`}
              hide={!device.permissions.includes('MANAGE')}
              title="Share access"
            />
            <DeviceOptionMenu device={device} />
          </Typography>
          {device.attributes.description && (
            <Gutters top={null}>
              <Typography variant="body2" color="textSecondary">
                {device.attributes.description}
              </Typography>
            </Gutters>
          )}
          <ListHorizontal dense>
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
              title="Configure"
              icon="sliders"
              iconColor="grayDarker"
              pathname={`/devices/${device.id}/edit`}
              dense
            />
            <UsersTab instance={device} to={`/devices/${device.id}/users`} />
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
