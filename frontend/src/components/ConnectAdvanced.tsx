import React from 'react'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { List, ListItem, ListItemIcon, ListItemText, Box } from '@mui/material'
import { PublicSetting } from './PublicSetting'
import { DeviceContext } from '../services/Context'
import { RouteSetting } from './RouteSetting'
import { TimeoutSetting } from './TimeoutSetting'
import { useApplication } from '../hooks/useApplication'
import { ConnectionLogSetting } from './ConnectionLogSetting'
import { HeaderOverrideSetting } from './HeaderOverrideSetting'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ConnectionDetails } from './ConnectionDetails'
import { SubdomainSetting } from './SubdomainSetting'
import { NoConnectionPage } from '../pages/NoConnectionPage'
import { LanShareSelect } from './LanShareSelect'
import { ListItemQuote } from './ListItemQuote'
import { LaunchSelect } from './LaunchSelect'
import { ListItemBack } from './ListItemBack'
import { ListItemCopy } from './ListItemCopy'
import { PortSetting } from './PortSetting'
import { IconButton } from '../buttons/IconButton'
import { DesktopUI } from './DesktopUI'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

export const ConnectAdvanced: React.FC = () => {
  const { t } = useTranslation()
  const { connection, service, instance } = React.useContext(DeviceContext)
  const accordion = useSelector((state: State) => state.ui.accordion)
  const dispatch = useDispatch<Dispatch>()
  const app = useApplication(service, connection)

  if (!service) return <NoConnectionPage />

  return (
    <Gutters size="md" top={null} bottom={null}>
      <ConnectionDetails connection={connection} app={app} show={connection.enabled || connection.connectLink} />
      <Box display="flex" marginTop={2}>
        <ListItemBack title={t('connectAdvanced.configTitle', 'Connection configuration')} to="connect" />
        <IconButton
          name="undo"
          color="grayDark"
          title={t('connectAdvanced.resetConnection', 'Reset connection')}
          onClick={() => dispatch.connections.forget(connection.id)}
        />
      </Box>
      <AccordionMenuItem
        gutters
        subtitle={t('connectAdvanced.advanced', 'Advanced')}
        defaultExpanded
        disabled
        action={
          <>
            <IconButton
              name="square-dashed"
              title={t('connectAdvanced.connectionDefaults', 'Connection Defaults')}
              color="grayDarker"
              to="defaults"
            />
            <IconButton
              name="object-intersect"
              title={t('connectAdvanced.connectionTypeDefaults', 'Connection Type Defaults')}
              color="grayDarker"
              to={`/settings/defaults/${service?.typeID}`}
            />
          </>
        }
      >
        <List disablePadding>
          {!connection.public && (
            <DesktopUI>
              <SubdomainSetting connection={connection} service={service} instance={instance} />
              <PortSetting connection={connection} service={service} />
            </DesktopUI>
          )}
          <DesktopUI hide>
            <PublicSetting connection={connection} service={service} />
          </DesktopUI>
          <LaunchSelect connection={connection} service={service} />
          <DesktopUI>
            <RouteSetting connection={connection} service={service} />
            <LanShareSelect connection={connection} />
            <HeaderOverrideSetting connection={connection} service={service} />
            <TimeoutSetting connection={connection} service={service} />
          </DesktopUI>
        </List>
      </AccordionMenuItem>
      {!connection.public && (
        <AccordionMenuItem
          gutters
          subtitle={t('connectAdvanced.logs', 'Logs')}
          expanded={accordion.logs}
          onClick={() => dispatch.ui.accordion({ logs: !accordion.logs })}
          elevation={0}
        >
          <List disablePadding>
            <ListItem dense>
              <ListItemIcon>
                <Icon name="terminal" />
              </ListItemIcon>
              <ListItemText
                primary={t('connectAdvanced.cliCommandLog', 'CLI command log')}
                secondary={connection.commandLog?.length ? undefined : t('connectAdvanced.empty', 'Empty')}
              />
            </ListItem>
            <ListItemQuote>
              {connection.commandLog?.map((l, i) => (
                <ListItem key={i} disablePadding>
                  <ListItemCopy value={l} hideIcon fullWidth dense />
                </ListItem>
              ))}
            </ListItemQuote>
            <ConnectionLogSetting connection={connection} service={service} />
            {(connection.rawCommand || connection.rawEndpoint) && (
              <>
                <ListItem dense>
                  <ListItemIcon>
                    <Icon name="code" />
                  </ListItemIcon>
                  <ListItemText primary={t('connectAdvanced.debugging', 'Debugging')} />
                </ListItem>
                <ListItemQuote>
                  <ListItem disablePadding>
                    <ListItemCopy
                      value={connection.rawEndpoint}
                      label={t('connectAdvanced.agentEndpoint', 'Agent Endpoint')}
                      hideIcon
                      fullWidth
                      dense
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemCopy
                      value={connection.rawCommand}
                      label={t('connectAdvanced.agentCommand', 'Agent Command')}
                      hideIcon
                      fullWidth
                      dense
                    />
                  </ListItem>
                </ListItemQuote>
              </>
            )}
          </List>
        </AccordionMenuItem>
      )}
    </Gutters>
  )
}
