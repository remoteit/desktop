import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import useClipboard from '../hooks/useClipboard'
import { openServiceURL } from '../services/browser'
import { emit } from '../services/Controller'
import { LocalSubnetName, subnetWebURL } from '../services/localSubnet'
import { useApplication } from '../hooks/useApplication'
import { saveLaunchTokens } from '../helpers/connectionHelper'
import { PromptModal } from './PromptModal'
import { Confirm } from './Confirm'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { graphQLDetectedSchemes, redirectLoops } from '../services/graphQLDetectedScheme'
import { sshCommand } from '../helpers/sshHelper'
import { formatPorts, isMultiPort } from '../services/multiPortServices'
import { ConnectRoute, ConnectRouteVariant } from './ConnectRoute'

/* A service reached by its name on this machine: the device daemon here resolves it (services/localSubnet), so there
   is nothing to start — the name and port are the connection. Copy it into ssh, a browser, a database client, or
   launch it as its type would a connection — the same templates and launch methods, the name as the host and the
   service's own port. A web service uses HTTPS at the port for its name. The shared name's HTTPS entry can forward
   to HTTP on port 80 when port 443 has no service of its own. An SSH service is shown and copied as
   the command that reaches it, plain `ssh`: that of an app signing people in by certificate (byCertificate) works as it
   is from a machine signed in on its remote.it device app, which gets a certificate for its own ssh (connectd
   remoteit-device ssh-config), and says so. A multi-port
   service is reached here on every port it lists, each by its own number (graphql-api docs/MULTI-PORT-SERVICES.md), so
   they are all shown; what is copied and launched is the first, as for a connection. A web service whose device passed
   its redirect to https:// on the same host back to the browser (services/graphQLDetectedScheme redirectLoops) would
   only loop on its name: Launch says so first, and the way out is its type, HTTPS on the port it redirects to. */
type Props = {
  local: LocalSubnetName
  // A service's own name's port (presence-server docs/subnet-service-names.md): its usual one, ssh's 22 — where it has
  // none, the service's own port.
  port?: number
  defaultHttp?: boolean
  service?: IService
  connection?: IConnection
  byCertificate?: boolean
  variant?: ConnectRouteVariant
}

export const LocalSubnetConnect: React.FC<Props> = ({
  local,
  port: namePort,
  defaultHttp,
  service,
  connection,
  byCertificate,
  variant = 'primary',
}) => {
  const { t } = useTranslation()
  const clipboard = useClipboard()
  const port = namePort || service?.port
  const ssh = service?.typeID === 28
  // The service's connection with the name in place of the proxy's address: never saved, only launched from.
  const here = useMemo<IConnection | undefined>(
    () =>
      connection && {
        ...connection,
        host: local.name,
        port,
        connected: true,
        ready: true,
        enabled: true,
        online: true,
      },
    [connection, local.name, port]
  )
  const app = useApplication(service, here)
  const [prompt, setPrompt] = useState(false)
  const [loopWarning, setLoopWarning] = useState(false)
  const [loopPort, setLoopPort] = useState<number>()
  const deviceSessions = useDeviceSessions()
  const web = app.urlForm
  const webPort = port === 80 && defaultHttp ? 443 : port || 443

  useEffect(() => {
    setLoopPort(undefined)
    if (!web || !deviceSessions || !service?.deviceID) return
    let current = true
    graphQLDetectedSchemes(service.deviceID).then(result => {
      const detected = typeof result === 'object' ? result[service.id] : null
      if (current && detected && redirectLoops(detected, service, webPort)) setLoopPort(detected.port)
    })
    return () => {
      current = false
    }
  }, [web, webPort, deviceSessions, service?.deviceID, service?.id, service?.typeID, service?.port])
  const launchable = web || app.canLaunch
  const endpoint = web
    ? subnetWebURL(local.name, webPort)
    : ssh
    ? sshCommand(local.name, port)
    : port
    ? `${local.name}:${port}`
    : local.name

  const launch = (tokens: ILookup<string> = {}) => {
    setPrompt(false)
    setLoopWarning(false)
    if (web) return openServiceURL(endpoint)
    saveLaunchTokens(service?.id, tokens)
    const command = app.preview(tokens)
    if (app.launchType === 'URL') openServiceURL(command)
    else emit('launch/app', Object.keys(tokens).length ? command : app.sshConfigString, app.launchType)
  }

  const copyOnly = !launchable || (ssh && !app.canLaunch)
  const label = copyOnly
    ? clipboard.copied
      ? t('connectRoute.copied', 'Copied')
      : ssh
      ? t('connectRoute.copySsh', 'Copy ssh command')
      : t('connectRoute.copyAddress', 'Copy address')
    : web
    ? t('connectRoute.openBrowser', 'Open in browser')
    : ssh
    ? t('connectRoute.openTerminal', 'Open terminal')
    : t('connectRoute.openApp', 'Open in {{app}}', { app: app.title })

  const run = () => {
    if (copyOnly) return clipboard.copy(endpoint)
    if (!web && app.prompt) return setPrompt(true)
    if (web && loopPort) return setLoopWarning(true)
    launch()
  }

  return (
    <ConnectRoute
      variant={variant}
      icon={copyOnly ? 'copy' : web ? 'globe' : ssh ? 'terminal' : 'launch'}
      label={label}
      how={t('localSubnetConnect.how', 'Through Access on this computer. No connection to start.')}
      address={endpoint}
      onClick={run}
      details={
        <>
          {isMultiPort(service) && (
            <Typography variant="caption" color="textSecondary" component="div">
              {t('localSubnetConnect.allPorts', 'Ports: {{ports}}', { ports: formatPorts(service?.ports) })}
            </Typography>
          )}
          {local.address && (
            <Typography variant="caption" color="textSecondary" component="div">
              {t('localSubnetConnect.resolves', 'Resolves here to {{address}}', { address: local.address })}
            </Typography>
          )}
          {byCertificate && (
            <Typography variant="caption" color="textSecondary" component="div">
              {t('localSubnetConnect.certificateHint', 'Works from any computer signed in to the Remote.It app.')}
            </Typography>
          )}
        </>
      }
    >
      {loopPort && (
        <Confirm
          open={loopWarning}
          title={t('localSubnetConnect.loopTitle', 'This page would loop')}
          action={t('localSubnetConnect.openAnyway', 'Open anyway')}
          onConfirm={() => launch()}
          onDeny={() => setLoopWarning(false)}
        >
          {t(
            'localSubnetConnect.loop',
            'This service redirects to HTTPS, so its page would loop. Switch it to port {{port}} (HTTPS) in its configuration to open it.',
            { port: loopPort }
          )}
        </Confirm>
      )}
      {launchable && <PromptModal app={app} open={prompt} onClose={() => setPrompt(false)} onSubmit={launch} />}
    </ConnectRoute>
  )
}
