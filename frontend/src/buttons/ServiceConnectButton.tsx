import React, { useState, useContext, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Box, Collapse, List, Skeleton, Typography } from '@mui/material'
import { State } from '../store'
import { clearConnectionError } from '../helpers/connectionHelper'
import { ConnectRouteKind, chooseRoutes } from '../helpers/connectRoutes'
import { GUIDE_START_DATE } from '../constants'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { DeviceContext } from '../services/Context'
import { GuideBubble } from '../components/GuideBubble'
import { DesktopUI } from '../components/DesktopUI'
import { Gutters } from '../components/Gutters'
import { LocalSubnetConnect } from '../components/LocalSubnetConnect'
import { opensTerminal } from '../helpers/sshHelper'
import { useLocalSignIn, useSubnetReach } from '../hooks/useLocalSubnetName'
import { LocalSignInNotice } from '../components/LocalSignInNotice'
import { BrowserGatewayConnect } from '../components/BrowserGatewayConnect'
import { AppTerminalOption } from '../components/AppTerminal'
import { useServiceApp } from '../hooks/useDeviceApps'
import { useApplication } from '../hooks/useApplication'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { LocalPortConnect } from '../components/LocalPortConnect'
import { LocalPortsListed } from '../components/LocalPortsListed'
import { PublicAddressConnect } from '../components/PublicAddressConnect'
import { ConnectRoute, ConnectRouteVariant } from '../components/ConnectRoute'
import { useLocalPort } from '../hooks/useLocalPort'
import { wantsHttps } from '../services/localPorts'
import { HTTP_TYPE } from '../services/graphQLDetectedScheme'
import { isReverseProxy } from '../models/applicationTypes'

export const ServiceConnectButton: React.FC = () => {
  const { t } = useTranslation()
  const { device, service, connection, instance } = useContext(DeviceContext)
  const [showError, setShowError] = useState<boolean>(true)
  const reverseProxy = useSelector((state: State) => isReverseProxy(state, service?.typeID))
  const deviceSessions = useDeviceSessions()
  const reach = useSubnetReach(device?.id, service?.id)
  const local = reach.local
  // A service's own name's port goes with that name alone: the one this machine answered may be its device's (a daemon
  // without service names, through the portal's probe), reached at the service's own port.
  const namePort = local && local.name !== reach.name ? undefined : reach.port
  const sharedHttpsInUse = device?.services.some(
    other => other.id !== service?.id && other.enabled !== false && other.port === 443
  )
  const defaultHttp = !sharedHttpsInUse && service?.typeID === HTTP_TYPE && service.port === 80
  const web = useApplication(service, connection).web
  const ssh = service?.typeID === 28
  const serving = useServiceApp(device, service)
  const byCertificate = opensTerminal(serving.app, serving.appService)
  const named = reach.checked && !!reach.name
  const localPort = useLocalPort(service?.id, device?.id)
  const [portAsked, setPortAsked] = useState(false)
  useEffect(() => {
    if (localPort.local && !localPort.local.open && !localPort.busy) setPortAsked(false)
  }, [localPort.local?.open, localPort.busy])
  const portChosen = localPort.offered && (portAsked || !!localPort.local?.open)

  const routes = chooseRoutes({
    address: !!local,
    terminal: named && ssh,
    localPort: localPort.offered,
    localPortChosen: portChosen,
    publicActive: !!connection.enabled || !!connection.connecting,
  })
  // The app's own terminal while it runs is the terminal route; otherwise what the app is doing, and turning it on.
  const appOption = byCertificate && (!named || serving.app?.state !== 'running')
  const checking = !!reach.name && !reach.checked && !connection.enabled && !portChosen
  const byAddress = routes.primary === 'address' || routes.primary === 'terminal'
  // remote.it is on this machine but does not act for this person (services/localSubnet localSignIn): signing in there
  // is offered, the other routes working meanwhile.
  const signIn = useLocalSignIn(!local && named && !portChosen)
  const noAgent = named && !local && !ssh && !signIn && !portChosen
  const usePort = () => {
    setPortAsked(true)
    // A web service asks for https the first time (graphql serves it where it can); after that, as the person left it.
    localPort.open(undefined, wantsHttps(!!web, localPort.local) || undefined)
  }

  // The address works here, so the public route is not in use: an error an earlier attempt left on the connection —
  // saved with it, so back on every reload, and red on the service — is stale, and cleared.
  useEffect(() => {
    if (byAddress && !connection.enabled && connection?.error) clearConnectionError(connection)
  }, [byAddress, connection?.error])

  if (!service) return null
  const offline = service.state !== 'active' && !!device?.name

  const route = (kind: ConnectRouteKind, variant: ConnectRouteVariant) => {
    switch (kind) {
      case 'address':
        return (
          <LocalSubnetConnect
            key={kind}
            variant={variant}
            local={local!}
            port={namePort}
            defaultHttp={defaultHttp}
            service={service}
            connection={connection}
            byCertificate={byCertificate}
          />
        )
      case 'terminal':
        return (
          <BrowserGatewayConnect
            key={kind}
            variant={variant}
            name={reach.name!}
            port={reach.port || service.port || 22}
            title={service.name}
            service={service.id}
            byCertificate={byCertificate}
          />
        )
      case 'localPort':
        return variant === 'primary' && portChosen ? (
          <LocalPortConnect key={kind} state={localPort} service={service} connection={connection} />
        ) : (
          <ConnectRoute
            key={kind}
            variant={variant}
            icon="laptop-code"
            label={
              variant === 'primary'
                ? t('localPortConnect.connect', 'Connect')
                : t('localPortConnect.optionLabel', 'Connect on a local port')
            }
            how={t('localPortConnect.optionHow', 'Opens a port on this computer that connects when used.')}
            onClick={usePort}
            loading={localPort.busy}
          />
        )
      case 'public':
        return (
          <PublicAddressConnect
            key={kind}
            variant={variant}
            device={device}
            service={service}
            connection={connection}
            permissions={instance?.permissions}
            reverseProxy={reverseProxy}
            signedInAddresses={deviceSessions}
            showError={showError}
            onToggleError={() => setShowError(!showError)}
          />
        )
    }
  }

  return (
    <Collapse in={!connection.connectLink} timeout={800}>
      <Gutters top="md" bottom="sm" size="md">
        {signIn && !local && !portChosen && (
          <Box sx={{ marginBottom: 2 }}>
            <LocalSignInNotice signIn={signIn} />
          </Box>
        )}
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
                <b>{t('serviceConnectButton.guideConnect', 'Connect to this service')}</b>
              </Typography>
              <DesktopUI hide>
                <Typography variant="body2" gutterBottom>
                  {t('serviceConnectButton.guideBodyRoute', 'The big button picks the best way from where you are.')}
                </Typography>
              </DesktopUI>
              <DesktopUI>
                <Typography variant="body2" gutterBottom>
                  {t(
                    'serviceConnectButton.guideBodyOnDemand',
                    'Connect starts listening for this service. It connects when used and disconnects when idle.'
                  )}
                </Typography>
              </DesktopUI>
            </>
          }
        >
          <Box
            data-testid="connect-primary"
            data-route={checking ? 'checking' : routes.primary}
            sx={{ bgcolor: 'primaryHighlight.main', borderRadius: 2, paddingX: { xs: 2, sm: 2.5 }, paddingY: 2 }}
          >
            {checking ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Skeleton variant="rounded" width={220} height={48} />
                <Typography variant="body2" color="textSecondary">
                  {t('serviceConnectButton.checking', 'Finding the best way to connect…')}
                </Typography>
              </Box>
            ) : (
              route(routes.primary, 'primary')
            )}
          </Box>
        </GuideBubble>
        {noAgent && (
          <Typography
            variant="caption"
            color="textSecondary"
            component="p"
            sx={{ paddingX: { xs: 2, sm: 2.5 }, marginTop: 1 }}
            data-testid="connect-no-agent"
          >
            {t(
              'serviceConnectButton.noAgent',
              'To open {{service}} by its address, use the Remote.It app on this computer with Access on.',
              { service: service.name }
            )}
          </Typography>
        )}
        {offline && (
          <Typography
            variant="caption"
            color="textSecondary"
            component="p"
            sx={{ paddingX: { xs: 2, sm: 2.5 }, marginTop: 1 }}
          >
            {t(
              'serviceConnectButton.offline',
              '{{device}} is offline. Connecting works again once it is back online.',
              {
                device: device?.name,
              }
            )}
          </Typography>
        )}
        <ConnectionErrorMessage connection={connection} visible={showError} />
        {!checking && (routes.others.length > 0 || appOption) && (
          <Box sx={{ marginTop: 2.5 }} data-testid="connect-more">
            <Typography variant="subtitle2" component="h3" sx={{ paddingLeft: { xs: 2, sm: 2.5 }, marginBottom: 0.5 }}>
              {t('serviceConnectButton.moreWays', 'More ways to connect')}
            </Typography>
            <List dense disablePadding>
              {routes.others.map(kind => route(kind, 'option'))}
            </List>
            {appOption && <AppTerminalOption device={device} service={service} serving={serving} />}
          </Box>
        )}
        {localPort.offered && localPort.others.length > 0 && <LocalPortsListed ports={localPort.others} />}
      </Gutters>
    </Collapse>
  )
}
