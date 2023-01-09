import React from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { List, ListItem, ListItemIcon, ListItemText, Box } from '@mui/material'
import { PublicSetting } from './PublicSetting'
import { DeviceContext } from '../services/Context'
import { RouteSetting } from './RouteSetting'
import { TimeoutSetting } from './TimeoutSetting'
import { ConnectionLogSetting } from './ConnectionLogSetting'
import { HeaderOverrideSetting } from './HeaderOverrideSetting'
import { AccordionMenuItem } from './AccordionMenuItem'
import { SubdomainSetting } from './SubdomainSetting'
import { NoConnectionPage } from '../pages/NoConnectionPage'
import { LanShareSelect } from './LanShareSelect'
import { ListItemQuote } from './ListItemQuote'
import { LaunchSelect } from './LaunchSelect'
import { ListItemBack } from './ListItemBack'
import { PortSetting } from './PortSetting'
import { IconButton } from '../buttons/IconButton'
import { DesktopUI } from './DesktopUI'
import { PortalUI } from './PortalUI'
import { DataCopy } from './DataCopy'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

export const ConnectAdvanced: React.FC = () => {
  const { connection, service, instance } = React.useContext(DeviceContext)
  const accordion = useSelector((state: ApplicationState) => state.ui.accordion)
  const dispatch = useDispatch<Dispatch>()

  if (!service) return <NoConnectionPage />

  return (
    <Gutters size="md" bottom={null}>
      <Box display="flex">
        <ListItemBack title="Connection configuration" />
        <IconButton
          name="undo"
          color="grayDark"
          title="Reset connection"
          onClick={() => dispatch.connections.forget(connection.id)}
        />
      </Box>
      <AccordionMenuItem
        gutters
        subtitle="Advanced"
        defaultExpanded
        disabled
        action={
          <>
            <IconButton name="square-dashed" title="Connection Defaults" color="grayDarker" to="defaults" />
            <IconButton
              name="object-intersect"
              title="Connection Type Defaults"
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
          <PortalUI>
            <PublicSetting connection={connection} service={service} />
          </PortalUI>
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
          subtitle="Logs"
          expanded={accordion.logs}
          onClick={() => dispatch.ui.accordion({ logs: !accordion.logs })}
          elevation={0}
        >
          <List disablePadding>
            <ListItem dense>
              <ListItemIcon>
                <Icon name="terminal" />
              </ListItemIcon>
              <ListItemText primary="CLI command log" secondary={connection.commandLog?.length ? undefined : 'Empty'} />
            </ListItem>
            <ListItemQuote>
              {connection.commandLog?.map((l, i) => (
                <ListItem key={i} disablePadding>
                  <DataCopy value={l} hideIcon fullWidth dense />
                </ListItem>
              ))}
            </ListItemQuote>
            <ConnectionLogSetting connection={connection} service={service} />
          </List>
        </AccordionMenuItem>
      )}
    </Gutters>
  )
}
