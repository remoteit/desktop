import React, { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { useHistory } from 'react-router-dom'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { Typography, ButtonBase, Box } from '@mui/material'
import { LicensingNotice } from './LicensingNotice'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { ShareButton } from '../buttons/ShareButton'
import { Container } from './Container'
import { MobileUI } from './MobileUI'
import { Gutters } from './Gutters'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'

type Props = {
  footer?: React.ReactNode
  backgroundColor?: Color
  children?: React.ReactNode
}

export const ServiceHeaderMenu: React.FC<Props> = ({ footer, backgroundColor, children }) => {
  const { t } = useTranslation()
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
  const deviceName = device.name

  return (
    <Container
      gutterBottom
      backgroundColor={backgroundColor}
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <OutOfBand />
          {layout.mobile && (
            <Box marginLeft={4.5} marginTop={2}>
              <ButtonBase onClick={() => history.push(`/devices/${device.id}`)}>
                <Typography variant="caption">
                  <Icon size="sm" platform={device?.targetPlatform} platformIcon inlineLeft />
                  {deviceName}
                </Typography>
              </ButtonBase>
            </Box>
          )}
          <Typography
            variant="h1"
            gutterBottom={!layout.mobile && !!service?.attributes.description}
            sx={{ alignItems: 'center', width: '100%', gap: 1 }}
          >
            <Title>{service.name || t('serviceHeaderMenu.unknown', 'unknown')}</Title>
            <Box display="flex" alignItems="center">
              <MobileUI hide>
                <ShareButton
                  to={`/devices/${device.id}/${service.id}/share`}
                  hide={!device.permissions.includes('MANAGE')}
                  title={t('serviceHeaderMenu.shareAccess', 'Share access')}
                />
              </MobileUI>
              <DeviceOptionMenu device={device} service={service} />
            </Box>
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
          {displayThisDevice && (
            <Gutters top={null} bottom="lg" size="xxs">
              <Notice gutterTop solid severity="info" onClose={() => dispatch.ui.set({ connectThisDevice: true })}>
                <strong>{t('serviceHeaderMenu.runningOnThisDevice', 'This service is running on this device.')}</strong>
                <br />
                {t('serviceHeaderMenu.connectFromAnywhere', 'It can be connected to from anywhere using Remote.It.')}
                <em>
                  {t(
                    'serviceHeaderMenu.selectAnotherDevice',
                    'Select another device from the devices menu to connect to it remotely.'
                  )}
                </em>
              </Notice>
            </Gutters>
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
