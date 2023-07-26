import React, { useContext, useEffect } from 'react'
import { DeviceContext } from '../services/Context'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { Typography } from '@mui/material'
import { LicensingNotice } from './LicensingNotice'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { ServiceConnectButton } from '../buttons/ServiceConnectButton'
import { AddUserButton } from '../buttons/AddUserButton'
import { ListItemCopy } from '../components/ListItemCopy'
import { Container } from './Container'
import { Gutters } from './Gutters'
import { Diagram } from './Diagram'
import { Notice } from '../components/Notice'
import { Color } from '../styling'
import { Link } from '../components/Link'

type Props = {
  footer?: React.ReactNode
  backgroundColor?: Color
  children?: React.ReactNode
}

export const ServiceHeaderMenu: React.FC<Props> = ({ footer, backgroundColor, children }) => {
  const { connectThisDevice } = useSelector((state: ApplicationState) => state.ui)
  const { device, service, instance, user } = useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    dispatch.ui.set({ connectThisDevice: false })
  }, [device?.id])

  if (!service || !device) return null

  const thisDevice = device?.thisDevice && instance?.owner.id === user.id
  const displayThisDevice = thisDevice && !connectThisDevice

  return (
    <Container
      gutterBottom
      backgroundColor={backgroundColor}
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <OutOfBand />
          <Typography variant="h1" gutterBottom={!service?.attributes.description}>
            <Title>{service.name || 'unknown'}</Title>
            <AddUserButton to="share" hide={!device.permissions.includes('MANAGE')} title="Share access" />
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
          {displayThisDevice ? (
            <Gutters top={null} bottom="lg" size="xxs">
              <Notice gutterTop solid severity="info">
                This service can be connected to from anywhere using Remote.It.
              </Notice>
              <Notice gutterTop severity="warning">
                <Typography variant="body2" gutterBottom>
                  You are on the same device as this service, so you should not connect with Remote.It. Connect directly
                  using the address below:
                </Typography>
                <ListItemCopy
                  label="Local endpoint"
                  value={`${service?.host || '127.0.0.1'}:${service?.port}`}
                  showBackground
                  fullWidth
                />
                <Typography variant="caption" display="block" marginTop={2} marginBottom={1}>
                  <Link color="grayDark.main" onClick={() => dispatch.ui.set({ connectThisDevice: true })}>
                    Connect anyway, I know what I'm doing.
                  </Link>
                </Typography>
              </Notice>
            </Gutters>
          ) : (
            <>
              <Gutters top={null} bottom="lg" size="md">
                <ServiceConnectButton />
              </Gutters>
              <Gutters top="xs" bottom="md">
                <Diagram />
              </Gutters>
            </>
          )}
        </>
      }
      footer={footer}
    >
      {children}
    </Container>
  )
}
