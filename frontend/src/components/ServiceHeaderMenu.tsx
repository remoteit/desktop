import React from 'react'
import { useParams } from 'react-router-dom'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { LicensingNotice } from './LicensingNotice'
import { Typography } from '@mui/material'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { LoadingMessage } from './LoadingMessage'
import { AddUserButton } from '../buttons/AddUserButton'
import { Container } from './Container'
import { Gutters } from './Gutters'
import { Color } from '../styling'
import { Diagram } from './Diagram'

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
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
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
          <Gutters top="xl" size="md" bottom="sm">
            <Diagram
              to={{
                initiator: `/devices/${device?.id}/${serviceID}/connect`,
                target: `/devices/${device?.id}/${serviceID}/edit`,
              }}
            />
          </Gutters>
        </>
      }
      footer={footer}
    >
      {children}
    </Container>
  )
}
