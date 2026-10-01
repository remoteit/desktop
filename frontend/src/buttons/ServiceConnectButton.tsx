import React, { useState, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { GUIDE_START_DATE } from '../constants'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { Box, Typography, Collapse } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { ComboButton } from './ComboButton'
import { GuideBubble } from '../components/GuideBubble'
import { ErrorButton } from '../buttons/ErrorButton'
import { DesktopUI } from '../components/DesktopUI'
import { Gutters } from '../components/Gutters'
import { LocalSubnetConnect } from '../components/LocalSubnetConnect'
import { useLocalSubnetName } from '../hooks/useLocalSubnetName'
import { Link } from '../components/Link'

export const ServiceConnectButton: React.FC = () => {
  const { t } = useTranslation()
  const { device, service, connection, instance } = useContext(DeviceContext)
  const [showError, setShowError] = useState<boolean>(true)
  // A name that works on this machine needs no connection: it is shown in place of Connect, the proxy one step away.
  const local = useLocalSubnetName(device?.id, service?.id)
  const [proxy, setProxy] = useState(false)

  return (
    <Collapse in={!connection.connectLink} timeout={800}>
      <Gutters top={null} bottom="lg" size="md">
        <GuideBubble
          guide="connectButton"
          enterDelay={400}
          hide={connection.connectLink}
          startDate={GUIDE_START_DATE}
          added={GUIDE_START_DATE}
          queueAfter={device ? 'availableServices' : 'addNetwork'}
          instructions={
            <>
              <Typography variant="h3" gutterBottom>
                <b>
                  <DesktopUI hide>{t('serviceConnectButton.guideTitleBrowser', 'Starting a connection')}</DesktopUI>
                  <DesktopUI>{t('serviceConnectButton.guideTitleDesktop', 'Connect on demand')}</DesktopUI>
                </b>
              </Typography>
              <DesktopUI hide>
                <Typography variant="body2" gutterBottom>
                  {t(
                    'serviceConnectButton.guideBodyBrowser',
                    'Create a connection to this service with the connect button.'
                  )}
                </Typography>
              </DesktopUI>
              <DesktopUI>
                <Typography variant="body2" gutterBottom>
                  {t(
                    'serviceConnectButton.guideBodyDesktop',
                    'Start listening on this endpoint for network requests. On request, automatically create the connection and disconnect when idle.'
                  )}
                </Typography>
              </DesktopUI>
              {connection.autoLaunch && (
                <Typography variant="body2" gutterBottom>
                  <em>
                    {t(
                      'serviceConnectButton.guideAutoLaunch',
                      'This connection will launch when connected because the "Auto Launch" configuration toggle is on.'
                    )}
                  </em>
                </Typography>
              )}
            </>
          }
        >
          <Gutters size="md" sx={{ display: 'flex', alignItems: 'flex-end', '& button': { height: 45 } }} bottom={null}>
            {local && !proxy ? (
              <Box sx={{ width: '100%' }}>
                <LocalSubnetConnect local={local} service={service} connection={connection} />
                <Typography variant="caption" component="div" sx={{ marginTop: 0.75, textAlign: 'right' }}>
                  <Link onClick={() => setProxy(true)}>
                    {t('serviceConnectButton.useProxy', 'Connect through the proxy instead')}
                  </Link>
                </Typography>
              </Box>
            ) : (
              <>
                <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
                <ComboButton
                  size="large"
                  iconType="solid"
                  service={service}
                  connection={connection}
                  permissions={instance?.permissions}
                  fullWidth
                />
              </>
            )}
          </Gutters>
        </GuideBubble>
        <ConnectionErrorMessage connection={connection} visible={showError} />
      </Gutters>
    </Collapse>
  )
}
