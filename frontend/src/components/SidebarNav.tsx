import React from 'react'
import { makeStyles } from '@mui/styles'
import { selectNetworks } from '../models/networks'
import { getDeviceModel } from '../models/accounts'
import { selectAnnouncements } from '../models/announcements'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { List, ListItemSecondaryAction, Tooltip, Divider, Chip } from '@mui/material'
import { selectEnabledConnections, selectActiveCount } from '../helpers/connectionHelper'
import { ListItemLocation } from './ListItemLocation'
import { ListItemLink } from './ListItemLink'
import { isRemoteUI } from '../helpers/uiHelper'
import { spacing } from '../styling'

export const SidebarNav: React.FC = () => {
  const { defaultSelection, unreadAnnouncements, connections, networks, active, devices, remoteUI } = useSelector(
    (state: ApplicationState) => {
      const connections = selectEnabledConnections(state)
      return {
        defaultSelection: state.ui.defaultSelection,
        unreadAnnouncements: selectAnnouncements(state, true).length,
        connections: connections.length,
        networks: selectNetworks(state).length,
        active: selectActiveCount(state, connections).length,
        devices: getDeviceModel(state).total,
        remoteUI: isRemoteUI(state),
      }
    }
  )
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles({ active })
  const pathname = path => defaultSelection[path] || path

  if (remoteUI)
    return (
      <List className={css.list}>
        <ListItemLocation
          title="This Device"
          pathname="/devices"
          match="/devices/:any?/:any?/:any?"
          icon="laptop"
          dense
        />
        <ListItemLocation title="Logs" pathname="/logs" icon="file-alt" dense />
      </List>
    )

  return (
    <List className={css.list}>
      <ListItemLocation
        title="Connections"
        icon="arrow-right-arrow-left"
        pathname={pathname('/connections')}
        match="/connections"
        dense
      >
        <ListItemSecondaryAction>
          {!!connections && !active && (
            <Tooltip title={`${connections.toLocaleString()} Idle Connections`} placement="top" arrow>
              <Chip size="small" label={connections.toLocaleString()} />
            </Tooltip>
          )}
          {!!active && (
            <Tooltip
              title={`${connections.toLocaleString()} Connections - ${active.toLocaleString()} Connected`}
              placement="top"
              arrow
            >
              <Chip
                size="small"
                label={active.toLocaleString()}
                className={css.active}
                variant="filled"
                color="primary"
              />
            </Tooltip>
          )}
        </ListItemSecondaryAction>
      </ListItemLocation>
      <ListItemLocation title="Devices" icon="router" pathname="/devices" match="/devices" exactMatch dense>
        {!!devices && (
          <ListItemSecondaryAction>
            <Tooltip title="Total Devices" placement="top" arrow>
              <Chip size="small" label={devices.toLocaleString()} />
            </Tooltip>
          </ListItemSecondaryAction>
        )}
      </ListItemLocation>
      <ListItemLocation title="Networks" icon="chart-network" pathname={pathname('/networks')} match="/networks" dense>
        <ListItemSecondaryAction>
          {!!networks && (
            <Tooltip title="Total Networks" placement="top" arrow>
              <Chip size="small" label={networks.toLocaleString()} />
            </Tooltip>
          )}
        </ListItemSecondaryAction>
      </ListItemLocation>
      <ListItemLocation title="Organization" pathname="/organization" icon="industry-alt" dense />
      <ListItemLocation title="Logs" pathname="/logs" icon="file-alt" dense />
      <Divider variant="inset" />
      <ListItemLink title="Scripting" href="https://link.remote.it/app/scripting" icon="scroll" dense />
      <ListItemLink title="Registrations" href="https://link.remote.it/app/registrations" icon="upload" dense />
      <ListItemLink title="Products" href="https://link.remote.it/app/products" icon="server" dense />
      <Divider variant="inset" />
      <ListItemLocation title="Inbox" pathname="/announcements" icon="envelope" badge={unreadAnnouncements} dense />
      <ListItemLocation
        className={css.footer}
        title="Contact"
        // subtitle="Support and Feedback"
        onClick={() => dispatch.feedback.reset()}
        pathname="/feedback"
        icon="envelope-open-text"
        dense
      />
    </List>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  list: {
    position: 'static',
    marginTop: spacing.sm,
    '& .MuiListItemText-primary': { color: palette.grayDark.main },
    '& .MuiListItem-button:hover .MuiListItemText-primary': { color: palette.black.main },
    '& .MuiListItem-button:hover path': { color: palette.grayDarkest.main },
    '& .MuiDivider-root': { margin: `${spacing.md}px ${spacing.lg}px` },
    '& .Mui-selected': {
      backgroundColor: palette.white.main,
      '& .MuiListItemText-primary': {
        color: palette.black.main,
      },
    },
  },
  connections: ({ active }: { active: number }) => ({
    borderTopRightRadius: active ? 0 : undefined,
    borderBottomRightRadius: active ? 0 : undefined,
    paddingRight: active ? spacing.xs : undefined,
  }),
  active: {
    fontWeight: 500,
  },
  footer: {
    position: 'fixed',
    bottom: spacing.lg,
    backgroundColor: palette.grayLighter.main,
    zIndex: 3,
  },
}))
