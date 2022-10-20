import React from 'react'
import { useParams } from 'react-router-dom'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { ListHorizontal } from './ListHorizontal'
import { LicensingNotice } from './LicensingNotice'
import { ListItemLocation } from './ListItemLocation'
import { Typography } from '@mui/material'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { LoadingMessage } from './LoadingMessage'
import { AddUserButton } from '../buttons/AddUserButton'
import { Container } from './Container'
import { UsersTab } from './UsersTab'
import { Gutters } from './Gutters'
import { Color } from '../styling'

export const ServiceHeaderMenu: React.FC<{
  device?: IDevice
  service?: IService
  footer?: React.ReactNode
  backgroundColor?: Color
  children?: React.ReactNode
}> = ({ device, service, footer, backgroundColor, children }) => {
  const { serviceID = '' } = useParams<{ deviceID: string; serviceID: string }>()

  if (!service || !device) return <LoadingMessage />

  return (
    <Container
      gutterBottom
      backgroundColor={backgroundColor}
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <OutOfBand />
          <Typography variant="h1">
            <Title>{service.name || 'unknown'}</Title>
            <AddUserButton
              to={`/devices/${device.id}/${service.id}/share`}
              hide={!device.permissions.includes('MANAGE')}
            />
            <DeviceOptionMenu device={device} service={service} />
          </Typography>
          {service.attributes.description && (
            <Gutters top={null}>
              <Typography variant="body2" color="textSecondary">
                {service.attributes.description}
              </Typography>
            </Gutters>
          )}
          {service.license === 'UNLICENSED' && <LicensingNotice instance={device} fullWidth />}
          <ListHorizontal dense>
            <ListItemLocation
              title="Connection"
              icon="arrow-right"
              iconColor="grayDarker"
              pathname={`/devices/${device.id}/${serviceID}/connect`}
              match={[`/devices/${device.id}/${serviceID}/connect`, `/devices/${device.id}/${serviceID}`]}
              exactMatch
              dense
            />
            <ListItemLocation
              title="Details"
              icon="info-circle"
              iconColor="grayDarker"
              pathname={`/devices/${device.id}/${serviceID}/details`}
              dense
            />
            {device.permissions.includes('MANAGE') && (
              <ListItemLocation
                title="Setup"
                icon="pen"
                iconColor="grayDarker"
                pathname={`/devices/${device.id}/${serviceID}/edit`}
                dense
              />
            )}
            <UsersTab instance={device} service={service} to={`/devices/${device.id}/${service.id}/users`} />
          </ListHorizontal>
        </>
      }
      footer={footer}
    >
      {children}
    </Container>
  )
}
