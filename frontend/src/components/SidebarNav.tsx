import React from 'react'
import { makeStyles } from '@mui/styles'
import { getDeviceModel } from '../models/accounts'
import { selectAnnouncements } from '../models/announcements'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { List, ListItemSecondaryAction, Tooltip, Divider, Chip } from '@mui/material'
import { selectEnabledConnections } from '../helpers/connectionHelper'
import { ListItemLocation } from './ListItemLocation'
import { ListItemLink } from './ListItemLink'
import { isRemoteUI } from '../helpers/uiHelper'
import { spacing } from '../styling'

export const SidebarNav: React.FC = () => {
  const { unreadAnnouncements, connections, sessions, devices, remoteUI } = useSelector((state: ApplicationState) => ({
    unreadAnnouncements: selectAnnouncements(state, true).length,
    connections: selectEnabledConnections(state).length,
    sessions: state.sessions.all.length,
    devices: getDeviceModel(state).total,
    remoteUI: isRemoteUI(state),
  }))
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles({ sessions })

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
      <ListItemLocation title="Networks" icon="chart-network" pathname="/networks" match="/networks" dense>
        <ListItemSecondaryAction>
          {!!connections && (
            <Tooltip title="Idle Connections" placement="top" arrow>
              <Chip size="small" label={connections.toLocaleString()} className={css.connections} />
            </Tooltip>
          )}
          {!!sessions && (
            <Tooltip title="Services Connected" placement="top" arrow>
              <Chip
                size="small"
                label={sessions.toLocaleString()}
                className={css.sessions}
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
            <Tooltip title="Total" placement="top" arrow>
              <Chip size="small" label={devices.toLocaleString()} />
            </Tooltip>
          </ListItemSecondaryAction>
        )}
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
  connections: ({ sessions }: { sessions: number }) => ({
    borderTopRightRadius: sessions ? 0 : undefined,
    borderBottomRightRadius: sessions ? 0 : undefined,
    paddingRight: sessions ? spacing.xs : undefined,
  }),
  sessions: {
    marginLeft: `-${spacing.xs}px !important`,
    fontWeight: 500,
  },
  footer: {
    position: 'fixed',
    bottom: spacing.lg,
    backgroundColor: palette.grayLighter.main,
    zIndex: 3,
  },
}))
