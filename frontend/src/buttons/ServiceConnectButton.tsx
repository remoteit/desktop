import React, { useState, useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { Dispatch, State } from '../store'
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
import { opensTerminal } from '../helpers/sshHelper'
import { useLocalSignIn, useSubnetReach } from '../hooks/useLocalSubnetName'
import { LocalSignInNotice } from '../components/LocalSignInNotice'
import { BrowserGatewayConnect } from '../components/BrowserGatewayConnect'
import { WebAddressConnect, WebAddressFailed, WebAddressUnchecked } from '../components/WebAddressConnect'
import { useOpenWebAddress, useWebAddress, useWebTarget } from '../hooks/useWebAddress'
import { useWaited } from '../hooks/useWaited'
import { WEB_ADDRESS_WAIT_MS } from '../services/webAddress'
import { AppTerminalOption } from '../components/AppTerminal'
import { useServiceApp } from '../hooks/useDeviceApps'
import { useApplication } from '../hooks/useApplication'
import { Link } from '../components/Link'
import { LocalPortConnect } from '../components/LocalPortConnect'
import { LocalPortsListed } from '../components/LocalPortsListed'
import { useLocalPort } from '../hooks/useLocalPort'
import { wantsHttps } from '../services/localPorts'
import { defaultHttpOnName } from '../services/graphQLDetectedScheme'

export const ServiceConnectButton: React.FC = () => {
  const { t } = useTranslation()
  const { device, service, connection, instance } = useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()
  const autoConnect = useSelector((state: State) => state.ui.autoConnect)
  const [showError, setShowError] = useState<boolean>(true)
  // A name that works on this machine needs no connection: it is shown in place of Connect, the proxy one step away.
  const reach = useSubnetReach(device?.id, service?.id)
  const local = reach.local
  // A service's own name's port goes with that name alone: the one this machine answered may be its device's (a daemon
  // without service names, through the portal's probe), reached at the service's own port.
  const namePort = local && local.name !== reach.name ? undefined : reach.port
  const defaultHttp = defaultHttpOnName(service, device)
  const [proxy, setProxy] = useState(false)
  const web = useApplication(service, connection).web
  const ssh = service?.typeID === 28
  // The app the service belongs to, where it does: one whose service is ssh and that signs people in by certificate
  // opens in our web SSH as well, with the person's own account (components/AppTerminal).
  const serving = useServiceApp(device, service)
  const byCertificate = opensTerminal(serving.app, serving.appService)
  // No agent here reaches it, but it has a name and is SSH: a terminal opens it through this browser's client
  // (components/BrowserGatewayConnect), the proxy one step away as for a local name.
  const terminal = !local && reach.checked && !!reach.name && ssh && !proxy
  // A web service is opened at its web address where the new proxies are enabled (services/webAddress): shown where no
  // agent here reaches it, and what the proxy is where one does. Whether one does is waited on before either is, and no
  // connection is started meanwhile.
  const webTarget = useWebTarget(service, connection)
  const checked = useWebAddress(webTarget)
  const webAddress = checked === true
  // Where whether it is could not be checked there is no Connect to press, and no proxy to take: it is tried again.
  const notChecked = checked === 'UNCHECKED'
  const address = useOpenWebAddress(service?.id)
  const unchecked = webAddress && !reach.checked
  const unanswered = useWaited(unchecked, WEB_ADDRESS_WAIT_MS)
  const webPanel = webAddress && !local && (reach.checked || unanswered)
  const hold = checked === undefined || (unchecked && !unanswered)
  // A local port of this machine (services/localPorts), where it runs our daemon: asked for here, or open already —
  // then it is what the panel shows, until it is disconnected.
  const localPort = useLocalPort(service?.id, device?.id)
  const [portAsked, setPortAsked] = useState(false)
  const onPort = localPort.offered && (portAsked || !!localPort.local?.open)
  useEffect(() => {
    if (localPort.local && !localPort.local.open && !localPort.busy) setPortAsked(false)
  }, [localPort.local?.open, localPort.busy])
  const named =
    !connection.enabled &&
    !onPort &&
    ((!!local && (webAddress || notChecked || !proxy)) || webPanel || notChecked || terminal)
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
  // this sets its own. A web address's own, where that is what is shown, is cleared by one that opens.
  const clearError = () => {
    if (connection?.error) clearConnectionError(connection)
  }
  useEffect(() => {
    if (named && (local || terminal)) clearError()
  }, [named, !!local, terminal, connection?.error])
  // Nothing is connected from here then: what was asked for on arrival at the page is what it shows.
  useEffect(() => {
    if (named && autoConnect && autoConnect === service?.id) dispatch.ui.set({ autoConnect: undefined })
  }, [named, autoConnect, service?.id])

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
                  <LocalSubnetConnect
                    local={local}
                    port={namePort}
                    defaultHttp={defaultHttp}
                    service={service}
                    connection={connection}
                    byCertificate={byCertificate}
                  />
                ) : webPanel ? (
                  service && <WebAddressConnect service={service} onOpened={clearError} />
                ) : notChecked ? (
                  <WebAddressUnchecked target={webTarget} />
                ) : (
                  service && (
                    <BrowserGatewayConnect
                      name={reach.name!}
                      port={reach.port || service.port || 22}
                      title={service.name}
                      service={service.id}
                      byCertificate={byCertificate}
                    />
                  )
                )}
                {!!local && notChecked && <WebAddressUnchecked target={webTarget} />}
                {!webPanel && !notChecked && checked !== undefined && (
                  <Typography variant="caption" component="div" sx={{ marginTop: 0.75, textAlign: 'right' }}>
                    <Link onClick={webAddress ? address.open : () => setProxy(true)}>
                      {t('serviceConnectButton.useProxy', 'Connect through the proxy instead')}
                    </Link>
                    {address.failed && <WebAddressFailed reason={address.failed.reason} />}
                  </Typography>
                )}
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
                  hold={hold}
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
          {/* An app's ssh service that signs people in by certificate: our web SSH, an option beside the ways above. */}
          {byCertificate && (
            <Gutters size="md" top={null} bottom={null}>
              <AppTerminalOption device={device} service={service} serving={serving} />
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
