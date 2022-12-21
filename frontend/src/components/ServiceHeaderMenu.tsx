import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { Typography } from '@mui/material'
import { LicensingNotice } from './LicensingNotice'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { ServiceConnectButton } from '../buttons/ServiceConnectButton'
import { AddUserButton } from '../buttons/AddUserButton'
import { Container } from './Container'
import { Gutters } from './Gutters'
import { Diagram } from './Diagram'
import { Color } from '../styling'

type Props = {
  footer?: React.ReactNode
  backgroundColor?: Color
  children?: React.ReactNode
}

export const ServiceHeaderMenu: React.FC<Props> = ({ footer, backgroundColor, children }) => {
  const { device, service } = useContext(DeviceContext)

  if (!service || !device) return null

  return (
    <Container
      gutterBottom
      backgroundColor={backgroundColor}
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      header={
        <>
          <OutOfBand />
          <Typography variant="h1" gutterBottom={!service?.attributes.description}>
            <Title>{service.name || 'unknown'}</Title>
            <AddUserButton to="share" hide={!device.permissions.includes('MANAGE')} />
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
          <Gutters top={null} bottom="lg" size="md">
            <ServiceConnectButton />
          </Gutters>
          <Gutters top="xs">
            <Diagram />
          </Gutters>
        </>
      }
      footer={footer}
    >
      {children}
    </Container>
  )
}
