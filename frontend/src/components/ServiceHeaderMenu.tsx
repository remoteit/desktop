import React, { useContext, useEffect } from 'react'
import { DeviceContext } from '../services/Context'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { attributeName } from '@common/nameHelper'
import { useHistory } from 'react-router-dom'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { Typography, ButtonBase } from '@mui/material'
import { LicensingNotice } from './LicensingNotice'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { ServiceConnectButton } from '../buttons/ServiceConnectButton'
import { ShareButton } from '../buttons/ShareButton'
import { ListItemCopy } from '../components/ListItemCopy'
import { Container } from './Container'
import { MobileUI } from './MobileUI'
import { Gutters } from './Gutters'
import { Diagram } from './Diagram'
import { Notice } from '../components/Notice'
import { Color } from '../styling'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'

type Props = {
  footer?: React.ReactNode
  backgroundColor?: Color
  children?: React.ReactNode
}

export const ServiceHeaderMenu: React.FC<Props> = ({ footer, backgroundColor, children }) => {
  const { connectThisDevice, layout } = useSelector((state: State) => state.ui)
  const { device, service, instance, user } = useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  useEffect(() => {
    if (connectThisDevice) dispatch.ui.set({ connectThisDevice: false })
  }, [device?.id])

  if (!service || !device) return null

  const thisDevice = device?.thisDevice && instance?.owner.id === user.id
  const displayThisDevice = thisDevice && !connectThisDevice
  const deviceName = attributeName(device)

  return (
    <Container
      gutterBottom
      backgroundColor={backgroundColor}
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <OutOfBand />
          {layout.mobile && (
            <Gutters bottom={null}>
              <ButtonBase onClick={() => history.push(`/devices/${device.id}`)}>
                <Typography variant="caption" onClick={() => history.push(`/devices/${device.id}`)}>
                  <Icon size="sm" platform={device?.targetPlatform} platformIcon inlineLeft />
                  {deviceName}
                </Typography>
              </ButtonBase>
            </Gutters>
          )}
          <Typography variant="h1" gutterBottom={!layout.mobile && !!service?.attributes.description}>
            <Title>{service.name || 'unknown'}</Title>
            <MobileUI hide>
              <ShareButton
                to={`/devices/${device.id}/${service.id}/share`}
                hide={!device.permissions.includes('MANAGE')}
                title="Share access"
              />
            </MobileUI>
            <DeviceOptionMenu device={device} service={service} />
          </Typography>
          {service.attributes.description && (
            <MobileUI hide>
              <Gutters top="xs" bottom="xs">
                <Typography variant="body2" color="textSecondary">
                  {service.attributes.description}
                </Typography>
              </Gutters>
            </MobileUI>
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
              <ServiceConnectButton />
              <Gutters top="xs" bottom="md">
                <Diagram />
              </Gutters>
            </>
          )}
        </>
      }
      footer={footer}
    >
      {service.attributes.description && (
        <MobileUI>
          <Gutters bottom={null}>
            <Typography variant="body2" color="textSecondary">
              {service.attributes.description}
            </Typography>
          </Gutters>
        </MobileUI>
      )}
      {children}
    </Container>
  )
}
