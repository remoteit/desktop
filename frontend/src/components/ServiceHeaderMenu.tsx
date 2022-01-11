import React from 'react'
import { useParams } from 'react-router-dom'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { ListHorizontal } from './ListHorizontal'
import { LicensingNotice } from './LicensingNotice'
import { ListItemLocation } from './ListItemLocation'
import { Typography } from '@material-ui/core'
import { ServiceOptionMenu } from './ServiceOptionMenu'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { RefreshButton } from '../buttons/RefreshButton'
import { AddUserButton } from '../buttons/AddUserButton'
import { UsersSelect } from './UsersSelect'
import { Container } from './Container'

export const ServiceHeaderMenu: React.FC<{
  device?: IDevice
  service?: IService
  target?: ITarget
  footer?: React.ReactNode
  backgroundColor?: string
}> = ({ device, service, target, footer, backgroundColor, children }) => {
  const { serviceID = '' } = useParams<{ deviceID: string; serviceID: string }>()

  if (!service || !device) return <UnauthorizedPage />

  return (
    <Container
      gutterBottom
      backgroundColor={backgroundColor}
      header={
        <>
          <OutOfBand />
          <Typography variant="h1">
            <Title>{service.name || 'unknown'}</Title>
            <RefreshButton device={device} />
            <AddUserButton
              to={`/devices/${device.id}/${service.id}/share`}
              hide={!device.permissions.includes('MANAGE')}
            />
            <ServiceOptionMenu device={device} service={service} target={target} />
          </Typography>
          {service.license === 'UNLICENSED' && <LicensingNotice device={device} fullWidth />}
          <ListHorizontal>
            <ListItemLocation
              title="Connect"
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
                title="Edit"
                icon="pen"
                iconColor="grayDarker"
                pathname={`/devices/${device.id}/${serviceID}/edit`}
                dense
              />
            )}
            <UsersSelect service={service} device={device} />
          </ListHorizontal>
        </>
      }
      footer={footer}
    >
      {children}
    </Container>
  )
}
