import React, { useState, useContext, useEffect } from 'react'
import { clearConnectionError } from '../helpers/connectionHelper'
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
import { isConsoleService } from '../helpers/sshHelper'
import { useLocalSignIn, useSubnetReach } from '../hooks/useLocalSubnetName'
import { LocalSignInNotice } from '../components/LocalSignInNotice'
import { BrowserGatewayConnect } from '../components/BrowserGatewayConnect'
import { ConsoleTerminalOption } from '../components/ConsoleTerminal'
import { useApplication } from '../hooks/useApplication'
import { Link } from '../components/Link'
import { LocalPortConnect } from '../components/LocalPortConnect'
import { LocalPortsListed } from '../components/LocalPortsListed'
import { useLocalPort } from '../hooks/useLocalPort'
import { wantsHttps } from '../services/localPorts'

export const ServiceConnectButton: React.FC = () => {
  const { t } = useTranslation()
  const { device, service, connection, instance } = useContext(DeviceContext)
  const [showError, setShowError] = useState<boolean>(true)
  // A name that works on this machine needs no connection: it is shown in place of Connect, the proxy one step away.
  const reach = useSubnetReach(device?.id, service?.id)
  const local = reach.local
  const [proxy, setProxy] = useState(false)
  // No agent here reaches it, but it has a name and serves the web: this browser's client can open it in its own tab
  // (services/browserGateway), the proxy one step away as for a local name.
  const web = useApplication(service, connection).urlForm
  const ssh = service?.typeID === 28
  const gateway = !local && reach.checked && !!reach.name && (!!web || ssh) && !proxy
  // A local port of this machine (services/localPorts), where it runs our daemon: asked for here, or open already —
  // then it is what the panel shows, until it is disconnected.
  const localPort = useLocalPort(service?.id, device?.id)
  const [portAsked, setPortAsked] = useState(false)
  const onPort = localPort.offered && (portAsked || !!localPort.local?.open)
  useEffect(() => {
    if (localPort.local && !localPort.local.open && !localPort.busy) setPortAsked(false)
  }, [localPort.local?.open, localPort.busy])
  const named = !onPort && ((!!local && !proxy) || gateway)
  // remote.it is on this machine but does not act for this person (services/localSubnet localSignIn): Connect goes
  // through this browser meanwhile, and signing in there is offered.
  const signIn = useLocalSignIn(!local && reach.checked && !!reach.name && !onPort)
  const usePort = () => {
    setPortAsked(true)
    // A web service asks for https the first time (graphql serves it where it can); after that, as the person left it.
    localPort.open(undefined, wantsHttps(!!web, localPort.local) || undefined)
  }
  const portLink = localPort.offered && (
    <Typography variant="caption" component="div" sx={{ marginTop: 0.75, textAlign: 'right' }}>
      <Link onClick={usePort}>{t('serviceConnectButton.useLocalPort', 'Connect on a local port instead')}</Link>
    </Typography>
  )
  // The name works here, so the proxy is not in use: an error an earlier proxy attempt left on the connection — saved
  // with it, so back on every reload, and red on the service — is stale, and cleared. A proxy attempt asked for after
  // this sets its own.
  useEffect(() => {
    if (named && connection?.error) clearConnectionError(connection)
  }, [named, connection?.error])

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
          {signIn && !local && !onPort && (
            <Gutters size="md" top={null} bottom={null}>
              <LocalSignInNotice signIn={signIn} />
            </Gutters>
          )}
          <Gutters size="md" sx={{ display: 'flex', alignItems: 'flex-end', '& button': { height: 45 } }} bottom={null}>
            {onPort ? (
              <Box sx={{ width: '100%' }}>
                <LocalPortConnect state={localPort} service={service} connection={connection} />
              </Box>
            ) : named ? (
              <Box sx={{ width: '100%' }}>
                {local ? (
                  <LocalSubnetConnect local={local} service={service} connection={connection} />
                ) : (
                  <BrowserGatewayConnect
                    name={reach.name!}
                    terminal={
                      ssh && service
                        ? {
                            port: service.port || 22,
                            title: service.name,
                            service: service.id,
                            console: isConsoleService(service),
                          }
                        : undefined
                    }
                  />
                )}
                <Typography variant="caption" component="div" sx={{ marginTop: 0.75, textAlign: 'right' }}>
                  <Link onClick={() => setProxy(true)}>
                    {t('serviceConnectButton.useProxy', 'Connect through the proxy instead')}
                  </Link>
                </Typography>
                {portLink}
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
          {!onPort && !named && portLink && (
            <Gutters size="md" top={null} bottom={null}>
              {portLink}
            </Gutters>
          )}
          {/* The console: our web SSH, an option beside the ways above. */}
          {isConsoleService(service) && (
            <Gutters size="md" top={null} bottom={null}>
              <ConsoleTerminalOption device={device} service={service} />
            </Gutters>
          )}
          {/* The service's other ports here that this machine's daemon lists: the machine's, opened by someone else. */}
          {localPort.offered && localPort.others.length > 0 && (
            <Gutters size="md" top={null} bottom={null}>
              <LocalPortsListed ports={localPort.others} />
            </Gutters>
          )}
        </GuideBubble>
        <ConnectionErrorMessage connection={connection} visible={showError} />
      </Gutters>
    </Collapse>
  )
}
