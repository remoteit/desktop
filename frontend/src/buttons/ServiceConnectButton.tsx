import React, { useState, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { GUIDE_START_DATE } from '../constants'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { Typography, Collapse } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { ComboButton } from './ComboButton'
import { GuideBubble } from '../components/GuideBubble'
import { ErrorButton } from '../buttons/ErrorButton'
import { DesktopUI } from '../components/DesktopUI'
import { Gutters } from '../components/Gutters'
import { useSubnetReach } from '../hooks/useLocalSubnetName'
import { useApplication } from '../hooks/useApplication'
import { connectKind, connectOptions } from '../helpers/connectOptions'
import { ServiceConnectOptions } from '../components/ServiceConnectOptions'

export const ServiceConnectButton: React.FC = () => {
  const { t } = useTranslation()
  const { device, service, connection, instance } = useContext(DeviceContext)
  const [showError, setShowError] = useState<boolean>(true)
  // With a name in device subnets, every way to connect, side by side (helpers/connectOptions); without one, the proxy.
  const reach = useSubnetReach(device?.id, service?.id)
  const web = useApplication(service, connection).urlForm
  const options = connectOptions(connectKind(service, web), !!reach.name, !!reach.local)

  const proxy = (
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
  )

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
          <Gutters
            size="md"
            // The options size their own buttons: the proxy's as here, the others' icon buttons as they are.
            sx={
              options.length > 1 ? undefined : { display: 'flex', alignItems: 'flex-end', '& button': { height: 45 } }
            }
            bottom={null}
          >
            {options.length > 1 ? (
              <ServiceConnectOptions
                options={options}
                name={reach.name!}
                local={reach.local}
                service={service}
                connection={connection}
                proxy={proxy}
              />
            ) : (
              proxy
            )}
          </Gutters>
        </GuideBubble>
        <ConnectionErrorMessage connection={connection} visible={showError} />
      </Gutters>
    </Collapse>
  )
}
