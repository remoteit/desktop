import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'
import { windowOpen } from '../services/browser'
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
import { Icon } from './Icon'

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
}

export const LocalSubnetConnect: React.FC<Props> = ({
  local,
  port: namePort,
  defaultHttp,
  service,
  connection,
  byCertificate,
}) => {
  const { t } = useTranslation()
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
    if (web) return windowOpen(endpoint, '_blank')
    saveLaunchTokens(service?.id, tokens)
    const command = app.preview(tokens)
    if (app.launchType === 'URL') windowOpen(command, '_blank', !command.startsWith('http'))
    else emit('launch/app', Object.keys(tokens).length ? command : app.sshConfigString, app.launchType)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        paddingX: 2,
        paddingY: 1.25,
        borderRadius: 1,
        bgcolor: 'primaryHighlight.main',
      }}
    >
      <Icon name="laptop" color="primary" />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="textSecondary" component="div">
          {t('localSubnetConnect.title', 'On this machine — no connection to start')}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={endpoint}>
          {endpoint}
        </Typography>
        {isMultiPort(service) && (
          <Typography variant="caption" color="textSecondary" component="div">
            {t('localSubnetConnect.ports', 'Every port of the service: {{ports}}', {
              ports: formatPorts(service?.ports),
            })}
          </Typography>
        )}
        {local.address && (
          <Typography variant="caption" color="textSecondary" component="div">
            {t('localSubnetConnect.address', 'resolves here to {{address}}', { address: local.address })}
          </Typography>
        )}
        {byCertificate && (
          <Typography variant="caption" color="textSecondary" component="div">
            {t('localSubnetConnect.sshHint', 'Works from a machine signed in on its remote.it device app')}
          </Typography>
        )}
      </Box>
      {launchable && (
        <IconButton
          icon="launch"
          color="primary"
          title={web ? t('localSubnetConnect.launch', 'Open in the browser') : app.contextTitle}
          onClick={() => (!web && app.prompt ? setPrompt(true) : web && loopPort ? setLoopWarning(true) : launch())}
        />
      )}
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
            'This service redirects to HTTPS, so its page would keep sending the browser back to itself. Switch it to port {{port}} (HTTPS) in its configuration to open it.',
            { port: loopPort }
          )}
        </Confirm>
      )}
      {launchable && <PromptModal app={app} open={prompt} onClose={() => setPrompt(false)} onSubmit={launch} />}
      <CopyIconButton value={endpoint} color="primary" />
    </Box>
  )
}
