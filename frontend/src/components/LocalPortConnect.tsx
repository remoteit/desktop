import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField, Typography } from '@mui/material'
import { directConnection } from '@common/applications'
import useClipboard from '../hooks/useClipboard'
import { openServiceURL } from '../services/browser'
import { emit } from '../services/Controller'
import { useApplication } from '../hooks/useApplication'
import { LocalPortState } from '../hooks/useLocalPort'
import { listedWhose, localPortHost, localPortWebURL, namesResolve, setNamesResolve } from '../services/localPorts'
import { saveLaunchTokens } from '../helpers/connectionHelper'
import { sshCommand } from '../helpers/sshHelper'
import { PromptModal } from './PromptModal'
import { Link } from './Link'
import { ConnectRoute } from './ConnectRoute'

/* A service on a local port of this machine (services/localPorts): this machine's device listens on 127.0.0.1 and
   connects on demand, under <name>.at.remote.it — or localhost, where a resolver here drops answers of 127.0.0.1. Shown
   as its type would be used: a web service as the http URL Launch opens, an SSH service as the ssh command, anything
   else as host:port. What is copied is what is shown. The port is the same every time; the person may choose their own,
   which is kept from then on. Disconnect stops the listening; the port and the name are kept for next time.
   https (graphql-api docs/LOCAL-PORT.md, "TLS"): where the port is served over https, a web service is shown and
   launched as https://<name>:<port>; "Use http instead" reopens it plain, on the same port — the way out when the
   handshake fails (the browser shows a connection error) or the name does not resolve here, since the certificate
   names the name alone. "Use https" goes back, offered while this machine can serve it.
   Whose it is: where the shell lists the machine's ports (state.listed), as the daemon lists it to the OS account the
   app runs in, in the words of connectd's menu — "every account", "yours", another person's — or that it does not
   answer this account (another person's account port, or one opened for an account not signed in here); elsewhere, the
   scope graphql says. */
type Props = { state: LocalPortState; service?: IService; connection?: IConnection }

export const LocalPortConnect: React.FC<Props> = ({ state, service, connection }) => {
  const { t } = useTranslation()
  const clipboard = useClipboard()
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
  // The service's connection with the local port in place of the proxy's address.
  const here = useMemo<IConnection | undefined>(
    () => connection && directConnection(connection, host, port),
    [connection, host, port]
  )
  const app = useApplication(service, here)
  const web = app.web
  const ssh = service?.typeID === 28
  const launchable = web || app.canLaunch

  const how = t('localPortConnect.how', 'On a local port of this computer.')

  if (!local) {
    return (
      <ConnectRoute
        variant="primary"
        icon="play"
        label={t('localPortConnect.connect', 'Connect')}
        how={how}
        loading={!state.error}
        error={state.error}
        details={
          !state.error && (
            <Typography variant="caption" color="textSecondary" component="div">
              {t('localPortConnect.opening', 'Opening a local port…')}
            </Typography>
          )
        }
      />
    )
  }

  // Not listed while the daemon has yet to apply it: said only once it listens.
  const whose = !local.open
    ? undefined
    : state.listed
    ? t('localPortConnect.listed', 'On this computer: {{whose}}', { whose: listedWhose(state.listed, t) })
    : state.listed === null && local.state === 'listening'
    ? t('localPortConnect.notListedHere', "Your account on this computer can't use it. Sign in to Remote.It there first.")
    : undefined

  const endpoint = web ? localPortWebURL(local, names) : ssh ? sshCommand(host, local.port) : `${host}:${local.port}`

  const launch = (tokens: ILookup<string> = {}) => {
    setPrompt(false)
    if (web) return openServiceURL(endpoint)
    saveLaunchTokens(service?.id, tokens)
    const command = app.preview(tokens)
    if (app.launchType === 'URL') openServiceURL(command)
    else emit('launch/app', Object.keys(tokens).length ? command : app.sshConfigString, app.launchType)
  }

  const savePort = () => {
    const chosen = Number(portText)
    if (!Number.isInteger(chosen) || chosen < 1 || chosen > 65535) return
    setEditing(false)
    state.open(chosen)
  }

  const copyOnly = !launchable || (ssh && !app.canLaunch)
  const label = !local.open
    ? t('localPortConnect.connect', 'Connect')
    : copyOnly
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
    if (!local.open) return state.open()
    if (copyOnly) return clipboard.copy(endpoint)
    if (!web && app.prompt) return setPrompt(true)
    launch()
  }

  const status = !local.open
    ? t('localPortConnect.closed', 'Closed')
    : local.state === 'failed'
    ? t('localPortConnect.failedDetail', 'Not listening. {{detail}}', { detail: local.detail || local.state })
    : local.state === 'pending'
    ? t('localPortConnect.startingHere', 'Starting on this computer…')
    : t('localPortConnect.listeningHow', 'Connects when used and closes when idle.')

  return (
    <ConnectRoute
      variant="primary"
      icon={!local.open ? 'play' : copyOnly ? 'copy' : web ? 'globe' : ssh ? 'terminal' : 'launch'}
      label={label}
      how={how}
      address={endpoint}
      onClick={run}
      loading={state.busy}
      error={state.error}
      details={
        <>
          <Typography variant="caption" color="textSecondary" component="div" data-testid="local-port-state">
            {status}
          </Typography>
          {whose ? (
            <Typography
              variant="caption"
              color={state.listed ? 'textSecondary' : 'warning.main'}
              component="div"
              data-testid="local-port-whose"
            >
              {whose}
            </Typography>
          ) : (
            local.open &&
            local.scope && (
              <Typography variant="caption" color="textSecondary" component="div" data-testid="local-port-scope">
                {local.scope === 'ACCOUNT'
                  ? t('localPortConnect.forAccount', 'For your account')
                  : t('localPortConnect.forMachine', 'For this whole computer')}
              </Typography>
            )
          )}
          <Typography
            variant="caption"
            component="div"
            sx={{ marginTop: 0.5, display: 'flex', flexWrap: 'wrap', columnGap: 2, alignItems: 'center' }}
          >
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
                {t('localPortConnect.useHttpPlain', "Doesn't open? Use http")}
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
                ? t('localPortConnect.useLocalhostShort', "Name doesn't open? Use localhost")
                : t('localPortConnect.useName', 'Use {{name}}', { name: local.host })}
            </Link>
            {local.open && (
              <Link onClick={() => state.close()} data-testid="local-port-disconnect">
                {t('localPortConnect.disconnect', 'Disconnect')}
              </Link>
            )}
          </Typography>
        </>
      }
    >
      {launchable && <PromptModal app={app} open={prompt} onClose={() => setPrompt(false)} onSubmit={launch} />}
    </ConnectRoute>
  )
}
