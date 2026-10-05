import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'
import { windowOpen } from '../services/browser'
import { emit } from '../services/Controller'
import { LocalSubnetName } from '../services/localSubnet'
import { useApplication } from '../hooks/useApplication'
import { saveLaunchTokens } from '../helpers/connectionHelper'
import { PromptModal } from './PromptModal'
import { isConsoleService, sshCommand } from '../helpers/sshHelper'
import { Icon } from './Icon'

/* A service reached by its name on this machine: the device daemon here resolves it (services/localSubnet), so there
   is nothing to start — the name and port are the connection. Copy it into ssh, a browser, a database client, or
   launch it as its type would a connection — the same templates and launch methods, the name as the host and the
   service's own port. A web service launches as https://<name>/: port 443 on a name is the host's web service, under
   the stage's certificate, whatever port it is on (presence-server docs/subnet-https.md). An SSH service is shown and
   copied as the command that reaches it, plain `ssh`: the console's works as it is from a machine signed in on its
   remote.it device app, which gets a certificate for its own ssh (connectd remoteit-device ssh-config). */
type Props = { local: LocalSubnetName; service?: IService; connection?: IConnection }

export const LocalSubnetConnect: React.FC<Props> = ({ local, service, connection }) => {
  const { t } = useTranslation()
  const port = service?.port
  const ssh = service?.typeID === 28
  const endpoint = ssh ? sshCommand(local.name, port) : port ? `${local.name}:${port}` : local.name
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
  const web = app.urlForm
  const launchable = web || app.canLaunch

  const launch = (tokens: ILookup<string> = {}) => {
    setPrompt(false)
    if (web) return windowOpen(`https://${local.name}/`, '_blank')
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
        {local.address && (
          <Typography variant="caption" color="textSecondary" component="div">
            {t('localSubnetConnect.address', 'resolves here to {{address}}', { address: local.address })}
          </Typography>
        )}
        {isConsoleService(service) && (
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
          onClick={() => (!web && app.prompt ? setPrompt(true) : launch())}
        />
      )}
      {launchable && <PromptModal app={app} open={prompt} onClose={() => setPrompt(false)} onSubmit={launch} />}
      <CopyIconButton value={endpoint} color="primary" />
    </Box>
  )
}
