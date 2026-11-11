import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, TextField, Typography } from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'
import { windowOpen } from '../services/browser'
import { emit } from '../services/Controller'
import { useApplication } from '../hooks/useApplication'
import { LocalPortState } from '../hooks/useLocalPort'
import { localPortHost, localPortWebURL, namesResolve, setNamesResolve } from '../services/localPorts'
import { saveLaunchTokens } from '../helpers/connectionHelper'
import { sshCommand } from '../helpers/sshHelper'
import { PromptModal } from './PromptModal'
import { Link } from './Link'
import { Icon } from './Icon'

/* A service on a local port of this machine (services/localPorts): this machine's device listens on 127.0.0.1 and
   connects on demand, under <name>.at.remote.it — or localhost, where a resolver here drops answers of 127.0.0.1. Shown
   as its type would be used: a web service as the http URL Launch opens, an SSH service as the ssh command, anything
   else as host:port. What is copied is what is shown. The port is the same every time; the person may choose their own,
   which is kept from then on. Disconnect stops the listening; the port and the name are kept for next time.
   https (graphql-api docs/LOCAL-PORT.md, "TLS"): where the port is served over https, a web service is shown and
   launched as https://<name>:<port>; "Use http instead" reopens it plain, on the same port — the way out when the
   handshake fails (the browser shows a connection error) or the name does not resolve here, since the certificate
   names the name alone. "Use https" goes back, offered while this machine can serve it. */
type Props = { state: LocalPortState; service?: IService; connection?: IConnection }

export const LocalPortConnect: React.FC<Props> = ({ state, service, connection }) => {
  const { t } = useTranslation()
  const { local } = state
  const [names, setNames] = useState<boolean>(true)
  const [editing, setEditing] = useState(false)
  const [portText, setPortText] = useState('')
  const [prompt, setPrompt] = useState(false)

  useEffect(() => {
    let live = true
    namesResolve().then(answer => live && setNames(answer !== false))
    return () => {
      live = false
    }
  }, [])

  const host = local ? localPortHost(local, names) : ''
  const port = local?.port
  // The service's connection with the local port in place of the proxy's address: never saved, only launched from.
  const here = useMemo<IConnection | undefined>(
    () => connection && { ...connection, host, port, connected: true, ready: true, enabled: true, online: true },
    [connection, host, port]
  )
  const app = useApplication(service, here)
  const web = app.urlForm
  const ssh = service?.typeID === 28
  const launchable = web || app.canLaunch

  if (!local) {
    return (
      <Panel>
        <Typography variant="body2" color="textSecondary">
          {state.error || t('localPortConnect.opening', 'Opening a local port…')}
        </Typography>
      </Panel>
    )
  }

  const endpoint = web ? localPortWebURL(local, names) : ssh ? sshCommand(host, local.port) : `${host}:${local.port}`

  const launch = (tokens: ILookup<string> = {}) => {
    setPrompt(false)
    if (web) return windowOpen(endpoint, '_blank')
    saveLaunchTokens(service?.id, tokens)
    const command = app.preview(tokens)
    if (app.launchType === 'URL') windowOpen(command, '_blank', !command.startsWith('http'))
    else emit('launch/app', Object.keys(tokens).length ? command : app.sshConfigString, app.launchType)
  }

  const savePort = () => {
    const chosen = Number(portText)
    if (!Number.isInteger(chosen) || chosen < 1 || chosen > 65535) return
    setEditing(false)
    state.open(chosen)
  }

  return (
    <Panel>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon name="laptop-code" color="primary" />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" color="textSecondary" component="div">
            {t('localPortConnect.title', 'On a local port of this machine')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={endpoint} data-testid="local-port-endpoint">
            {endpoint}
          </Typography>
          <Typography variant="caption" color="textSecondary" component="div" data-testid="local-port-state">
            {!local.open
              ? t('localPortConnect.closed', 'Closed')
              : local.state === 'failed'
              ? t('localPortConnect.failed', 'Not listening: {{detail}}', { detail: local.detail || local.state })
              : local.state === 'pending'
              ? t('localPortConnect.pending', 'Starting on this machine…')
              : t('localPortConnect.listening', 'Listening — connects when used, closes when idle')}
          </Typography>
          {local.open && local.scope && (
            <Typography variant="caption" color="textSecondary" component="div" data-testid="local-port-scope">
              {local.scope === 'ACCOUNT'
                ? t('localPortConnect.forAccount', 'For your account')
                : t('localPortConnect.forMachine', 'For this whole computer')}
            </Typography>
          )}
        </Box>
        {launchable && local.open && (
          <IconButton
            icon="launch"
            color="primary"
            title={web ? t('localPortConnect.launch', 'Open in the browser') : app.contextTitle}
            onClick={() => (!web && app.prompt ? setPrompt(true) : launch())}
          />
        )}
        {launchable && <PromptModal app={app} open={prompt} onClose={() => setPrompt(false)} onSubmit={launch} />}
        <CopyIconButton value={endpoint} color="primary" />
        {local.open ? (
          <IconButton
            icon="power-off"
            color="primary"
            title={t('localPortConnect.disconnect', 'Disconnect')}
            loading={state.busy}
            onClick={() => state.close()}
          />
        ) : (
          <IconButton
            icon="play"
            color="primary"
            title={t('localPortConnect.connect', 'Connect')}
            loading={state.busy}
            onClick={() => state.open()}
          />
        )}
      </Box>
      {state.error && (
        <Typography variant="caption" color="error" component="div" sx={{ marginTop: 0.5 }}>
          {state.error}
        </Typography>
      )}
      <Typography variant="caption" component="div" sx={{ marginTop: 0.5, display: 'flex', gap: 2, alignItems: 'center' }}>
        {editing ? (
          <>
            <TextField
              size="small"
              variant="standard"
              autoFocus
              value={portText}
              onChange={e => setPortText(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onKeyDown={e => e.key === 'Enter' && savePort()}
              inputProps={{ 'aria-label': t('localPortConnect.port', 'Port'), inputMode: 'numeric' }}
              sx={{ width: 80 }}
            />
            <Link onClick={savePort}>{t('localPortConnect.usePort', 'Use this port')}</Link>
            <Link onClick={() => setEditing(false)}>{t('localPortConnect.cancel', 'Cancel')}</Link>
          </>
        ) : (
          <Link
            onClick={() => {
              setPortText(String(local.port))
              setEditing(true)
            }}
          >
            {t('localPortConnect.changePort', 'Change port')}
          </Link>
        )}
        {web && local.https && (
          <Link onClick={() => state.open(undefined, false)} data-testid="local-port-use-http">
            {t('localPortConnect.useHttp', 'Does not open? Use http instead')}
          </Link>
        )}
        {web && !local.https && local.httpsAvailable && names && (
          <Link onClick={() => state.open(undefined, true)} data-testid="local-port-use-https">
            {t('localPortConnect.useHttps', 'Use https')}
          </Link>
        )}
        <Link
          onClick={() => {
            setNamesResolve(!names)
            setNames(!names)
            // localhost cannot be served under the name's certificate: plain from here.
            if (names && local.https) state.open(undefined, false)
          }}
        >
          {names
            ? t('localPortConnect.useLocalhost', 'Name does not open? Use localhost')
            : t('localPortConnect.useName', 'Use {{name}}', { name: local.host })}
        </Link>
      </Typography>
    </Panel>
  )
}

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ paddingX: 2, paddingY: 1.25, borderRadius: 1, bgcolor: 'primaryHighlight.main' }}>{children}</Box>
)
