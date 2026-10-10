import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Stack, Typography } from '@mui/material'
import { replaceHost } from '@common/nameHelper'
import { ConnectOption } from '../helpers/connectOptions'
import { isConsoleService, sshCommand } from '../helpers/sshHelper'
import { LocalSubnetName } from '../services/localSubnet'
import { windowOpen } from '../services/browser'
import { LocalSubnetConnect } from './LocalSubnetConnect'
import { BrowserGatewayConnect } from './BrowserGatewayConnect'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'
import { Icon } from './Icon'

/* A service's ways to connect, one labelled row each (helpers/connectOptions): the proxy's Connect is passed in as it
   is, the others open or copy. One that does not work here is greyed with why. */
type Props = {
  options: ConnectOption[]
  name: string
  local?: LocalSubnetName
  service?: IService
  connection?: IConnection
  proxy: React.ReactNode
}

const row = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  paddingX: 2,
  paddingY: 1.25,
  borderRadius: 1,
  bgcolor: 'primaryHighlight.main',
}

export const ServiceConnectOptions: React.FC<Props> = ({ options, name, local, service, connection, proxy }) => {
  const { t } = useTranslation()
  const port = service?.port || 22

  const unavailable = (label: string, reason: string) => (
    <Box sx={{ ...row, bgcolor: 'grayLightest.main', opacity: 0.7 }}>
      <Icon name="ban" color="grayDark" />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="textSecondary" component="div">
          {label}
        </Typography>
        <Typography variant="caption" component="div">
          {reason}
        </Typography>
      </Box>
    </Box>
  )

  const terminal = (via: 'subnet' | 'proxy') => {
    const label = t('serviceConnectOptions.terminal', 'Local terminal')
    // By the proxy: its address once connected — the name's certificates do not match it, so the device's own login.
    const host = via === 'subnet' ? local?.name : connection?.connected ? replaceHost(connection.host) : undefined
    const at = via === 'subnet' ? port : connection?.port
    if (!host || !at)
      return unavailable(label, t('serviceConnectOptions.proxyFirst', 'Connect through the proxy first'))
    const command = sshCommand(host, at)
    return (
      <Box sx={row}>
        <Icon name="terminal" color="primary" />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" color="textSecondary" component="div">
            {via === 'subnet'
              ? t('serviceConnectOptions.terminalSubnet', 'Local terminal — by its name on this machine')
              : t('serviceConnectOptions.terminalProxy', 'Local terminal — through the proxy')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={command}>
            {command}
          </Typography>
          {via === 'subnet' && isConsoleService(service) && (
            <Typography variant="caption" color="textSecondary" component="div">
              {t('localSubnetConnect.sshHint', 'Works from a machine signed in on its remote.it device app')}
            </Typography>
          )}
        </Box>
        <IconButton
          icon="launch"
          color="primary"
          title={t('serviceConnectOptions.sshLink', 'Open in the terminal (ssh://)')}
          onClick={() => windowOpen(`ssh://${host}:${at}`, '_blank', true)}
        />
        <CopyIconButton value={command} color="primary" />
      </Box>
    )
  }

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {options.map(option => {
        switch (option.id) {
          case 'proxy':
            return (
              <Box key="proxy">
                <Typography variant="caption" color="textSecondary" component="div" sx={{ marginBottom: 0.5 }}>
                  {t('serviceConnectOptions.proxy', 'Via proxy')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', '& button': { height: 45 } }}>{proxy}</Box>
              </Box>
            )
          case 'subnet':
            return local ? (
              <LocalSubnetConnect
                key="subnet"
                local={local}
                service={service}
                connection={connection}
                label={t('serviceConnectOptions.subnet', 'Via local subnet — no connection to start')}
              />
            ) : null
          case 'browser':
            return (
              <React.Fragment key="browser">
                {option.unavailable ? (
                  unavailable(
                    t('serviceConnectOptions.browser', 'Via the web client — in this browser'),
                    option.unavailable === 'agent'
                      ? t(
                          'serviceConnectOptions.browserAgent',
                          'The agent on this machine answers its name first: use the local subnet'
                        )
                      : t('serviceConnectOptions.browserType', 'Only web and SSH services open in the browser')
                  )
                ) : (
                  <BrowserGatewayConnect
                    name={name}
                    label={t('serviceConnectOptions.browser', 'Via the web client — in this browser')}
                  />
                )}
              </React.Fragment>
            )
          case 'browserSSH':
            return (
              <BrowserGatewayConnect
                key="browserSSH"
                name={name}
                label={t('serviceConnectOptions.browserSSH', 'Web SSH — a terminal in this browser')}
                terminal={{ port, title: service?.name, service: service?.id }}
              />
            )
          case 'terminal':
            return <React.Fragment key="terminal">{terminal(option.via)}</React.Fragment>
        }
      })}
    </Stack>
  )
}
