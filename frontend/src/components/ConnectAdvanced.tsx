import React from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { RouteSetting } from './RouteSetting'
import { TimeoutSetting } from './TimeoutSetting'
import { ConnectionLogSetting } from './ConnectionLogSetting'
import { TargetHostSetting } from './TargetHostSetting'
import { AccordionMenuItem } from './AccordionMenuItem'
import { NoConnectionPage } from '../pages/NoConnectionPage'
import { LanShareSelect } from './LanShareSelect'
import { ListItemQuote } from './ListItemQuote'
import { LaunchSelect } from './LaunchSelect'
import { ListItemBack } from './ListItemBack'
import { PortSetting } from './PortSetting'
import { NameSetting } from './NameSetting'
import { DesktopUI } from './DesktopUI'
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
      <ListItemBack title="Connection configuration" />
      <AccordionMenuItem gutters subtitle="Advanced" defaultExpanded disabled>
        <List disablePadding>
          {!connection.public && (
            <DesktopUI>
              <NameSetting connection={connection} service={service} instance={instance} />
              <PortSetting connection={connection} service={service} />
            </DesktopUI>
          )}
          <LaunchSelect connection={connection} service={service} />
          <DesktopUI>
            <RouteSetting connection={connection} service={service} />
            <LanShareSelect connection={connection} />
            <TargetHostSetting connection={connection} service={service} />
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
