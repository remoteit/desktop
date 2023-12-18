import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { Typography } from '@mui/material'
import { attributeName } from '@common/nameHelper'
import { ListItemLocation } from './ListItemLocation'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { LoadingMessage } from './LoadingMessage'
import { ListHorizontal } from './ListHorizontal'
import { ShareButton } from '../buttons/ShareButton'
import { Container } from './Container'
import { UsersTab } from './UsersTab'
import { MobileUI } from './MobileUI'
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
            <MobileUI hide>
              <ShareButton
                to={`/devices/${device.id}/share`}
                hide={!device.permissions.includes('MANAGE')}
                title="Share access"
              />
            </MobileUI>
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
              to={`/devices/${device.id}/details`}
              match={[`/devices/${device.id}`, `/devices/${device.id}/details`]}
              exactMatch
              dense
            />
            <ListItemLocation
              title="Configure"
              icon="sliders"
              iconColor="grayDarker"
              to={`/devices/${device.id}/edit`}
              dense
            />
            <UsersTab instance={device} to={`/devices/${device.id}/users`} />
            <ListItemLocation
              title="Logs"
              icon="file-alt"
              iconColor="grayDarker"
              to={`/devices/${device.id}/logs`}
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
