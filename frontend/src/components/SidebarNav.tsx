import React from 'react'
import { useSelector } from 'react-redux'
import { getDeviceModel } from '../models/accounts'
import { ApplicationState } from '../store'
import { selectAnnouncements } from '../models/announcements'
import { makeStyles, List, ListItemSecondaryAction, Tooltip, Divider, Chip } from '@material-ui/core'
import { selectConnections } from '../helpers/connectionHelper'
import { ListItemLocation } from './ListItemLocation'
import { ListItemLink } from './ListItemLink'
import { isRemoteUI } from '../helpers/uiHelper'
import { spacing } from '../styling'

export const SidebarNav: React.FC = () => {
  const { unreadAnnouncements, connections, sessions, devices, remoteUI } = useSelector((state: ApplicationState) => ({
    unreadAnnouncements: selectAnnouncements(state, true).length,
    connections: selectConnections(state).filter(connection => connection.enabled).length,
    sessions: state.sessions.all.length,
    devices: getDeviceModel(state).total,
    remoteUI: isRemoteUI(state),
  }))
  const css = useStyles({ sessions })

  return (
    <List className={css.list}>
      {remoteUI ? (
        <ListItemLocation title="This Device" pathname="/devices" match="/devices/:any?/:any?/:any?" icon="hdd" />
      ) : (
        <>
          <ListItemLocation title="Network" icon="chart-network" pathname="/connections" match="/connections">
            <ListItemSecondaryAction>
              {!!connections && (
                <Tooltip title="Added" placement="top" arrow>
                  <Chip size="small" label={connections.toLocaleString()} className={css.connections} />
                </Tooltip>
              )}
              {!!sessions && (
                <Tooltip title="Connected" placement="top" arrow>
                  <Chip size="small" label={sessions.toLocaleString()} className={css.sessions} color="primary" />
                </Tooltip>
              )}
            </ListItemSecondaryAction>
          </ListItemLocation>
          <ListItemLocation title="Devices" icon="hdd" pathname="/devices" match="/devices" exactMatch>
            {!!devices && (
              <ListItemSecondaryAction>
                <Tooltip title="Total" placement="top" arrow>
                  <Chip size="small" label={devices.toLocaleString()} />
                </Tooltip>
              </ListItemSecondaryAction>
            )}
          </ListItemLocation>
        </>
      )}
      <ListItemLocation title="Logs" pathname="/logs" icon="file-alt" dense />
      <Divider variant="inset" />
      <ListItemLink title="Scripting" href="https://app.remote.it/#scripting" icon="scroll" dense />
      <ListItemLink title="Registrations" href="https://app.remote.it/#registrations" icon="upload" dense />
      <ListItemLink title="Products" href="https://app.remote.it/#products" icon="server" dense />
      <Divider variant="inset" />
      <ListItemLocation
        title="Announcements"
        pathname="/announcements"
        icon="megaphone"
        badge={unreadAnnouncements}
        dense
      />
      <ListItemLocation title="Feedback" className={css.footer} pathname="/shareFeedback" icon="comment-smile" dense />
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
    '& .MuiDivider-root': { margin: `${spacing.md}px ${spacing.lg}px`, backgroundColor: palette.grayLight.main },
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
    position: 'absolute',
    bottom: spacing.lg,
  },
}))
