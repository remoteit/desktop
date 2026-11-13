import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Typography } from '@mui/material'
import { DeviceApp, graphQLSshHostKey } from '../services/graphQLDeviceApps'
import { useSubnetName } from '../hooks/useLocalSubnetName'
import { openTerminal } from '../helpers/terminalHelper'
import type { FirstPartyApp } from './firstPartyApps'

/* The console's own part of its row in the Apps section (remoteit.console: SSH by OpenSSH, run by the device's daemon,
   nothing listening): Open terminal, logging in by certificate through device subnets, and the host key the device
   reports, which the terminal checks. Its AI commands are its generic ai_commands setting, worded here. */

type Props = { device: IDevice; app: DeviceApp }

// The console's port: its service's.
export const consolePort = (device: IDevice | undefined, app: DeviceApp) =>
  device?.services?.find(service => service.id === app.serviceId)?.port

const ConsoleHostKey: React.FC<Props> = ({ app }) => {
  const { t } = useTranslation()
  const [hostKey, setHostKey] = useState<string | null>(null)
  const running = app.state === 'running' && app.serviceId

  useEffect(() => {
    setHostKey(null)
    if (!running || !app.serviceId) return
    let current = true
    graphQLSshHostKey(app.serviceId).then(key => current && setHostKey(key))
    return () => {
      current = false
    }
  }, [running, app.serviceId])

  if (!running || !hostKey) return null
  return (
    <Typography variant="caption" component="div" color="textSecondary" sx={{ wordBreak: 'break-all' }} data-host-key>
      {t('deviceApps.hostKey', 'Host key {{key}}', { key: hostKey })}
    </Typography>
  )
}

const ConsoleOpenTerminal: React.FC<Props> = ({ device, app }) => {
  const { t } = useTranslation()
  const name = useSubnetName(device.id)
  const port = consolePort(device, app)
  if (app.state !== 'running' || !name || !port || !app.serviceId) return null
  return (
    <Button
      size="small"
      variant="contained"
      onClick={() =>
        openTerminal({ name, port, title: t('deviceApps.console', 'Console'), service: app.serviceId || undefined })
      }
    >
      {t('deviceApps.openTerminal', 'Open terminal')}
    </Button>
  )
}

export const CONSOLE_APP: FirstPartyApp = {
  icon: 'terminal',
  state: (t, app) =>
    app.state === 'running'
      ? t('deviceApps.consoleRunning', 'Running — logins by certificate, nothing listening on the device')
      : app.state === 'off'
      ? t('deviceApps.consoleOff', 'Off — a terminal on this device, from this app, by certificate')
      : undefined,
  settings: t => ({
    ai_commands: {
      label: t('deviceApps.consoleAiCommands', 'Allow AI commands'),
      help: t(
        'deviceApps.consoleAiCommandsHelp',
        "AI assistants you authorize may run commands on this device's console through remote.it's MCP server. The device's administrator can turn this off on the machine."
      ),
    },
  }),
  Lines: ConsoleHostKey,
  Actions: ConsoleOpenTerminal,
}
