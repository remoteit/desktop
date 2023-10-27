import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { selectNetworks } from '../selectors/networks'
import { getDeviceModel } from '../selectors/devices'
import { selectLimitsLookup } from '../selectors/organizations'
import { selectDefaultSelected } from '../selectors/ui'
import { selectAllConnectionsCount } from '../selectors/connections'
import { selectAnnouncements } from '../models/announcements'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  Typography,
  Tooltip,
  Collapse,
  Chip,
} from '@mui/material'
import { selectConnectionSessions } from '../selectors/connections'
import { ListItemLocation } from './ListItemLocation'
import { ListItemLink } from './ListItemLink'
import { ExpandIcon } from './ExpandIcon'
import { isRemoteUI } from '../helpers/uiHelper'
import { spacing } from '../styling'

export const SidebarNav: React.FC = () => {
  const { defaultSelected, unreadAnnouncements, connections, networks, active, devices, remoteUI, limits, insets } =
    useSelector((state: ApplicationState) => ({
      defaultSelected: selectDefaultSelected(state),
      unreadAnnouncements: selectAnnouncements(state, true).length,
      connections: selectAllConnectionsCount(state),
      networks: selectNetworks(state).length,
      active: selectConnectionSessions(state).length,
      devices: getDeviceModel(state).total,
      remoteUI: isRemoteUI(state),
      limits: selectLimitsLookup(state),
      insets: state.ui.layout.insets,
    }))
  const dispatch = useDispatch<Dispatch>()
  const [more, setMore] = useState<boolean>()
  const css = useStyles({ active, insets })
  const pathname = path => defaultSelected[path] || path

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
          {!!connections && (
            <Tooltip title={`${connections.toLocaleString()} Idle Connections`} placement="top" arrow>
              <Chip size="small" label={connections.toLocaleString()} />
            </Tooltip>
          )}
          {/* {!!active && (
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
          )} */}
        </ListItemSecondaryAction>
      </ListItemLocation>
      <ListItemLocation title="Devices" icon="router" pathname="/devices" match="/devices" dense>
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
      <ListItemLocation title="Notifications" pathname="/announcements" icon="bell" badge={unreadAnnouncements} dense />
      <ListItem sx={{ marginTop: 2 }}>
        <ListItemButton onClick={() => setMore(!more)}>
          <Typography variant="subtitle2" color="grayDark.main">
            More
            <ExpandIcon open={more} color="grayDark" />
          </Typography>
        </ListItemButton>
      </ListItem>
      <Collapse in={more}>
        <ListItemLink title="Scripting" href="https://link.remote.it/app/scripting" icon="scroll" dense />
        <ListItemLink title="Registrations" href="https://link.remote.it/app/registrations" icon="upload" dense />
        <ListItemLink title="Products" href="https://link.remote.it/app/products" icon="server" dense />
      </Collapse>
      {limits.support > 10 ? (
        <ListItemLocation
          className={css.footer}
          title="Contact"
          onClick={() => dispatch.feedback.reset()}
          pathname="/feedback"
          icon="envelope-open-text"
          dense
        />
      ) : (
        <ListItemLink
          title="Support Forum"
          href="https://link.remote.it/forum"
          icon="comments"
          className={css.footer}
          dense
        />
      )}
    </List>
  )
}

type StyleProps = {
  active: number
  insets: ILayout['insets']
}

const useStyles = makeStyles(({ palette }) => ({
  list: {
    position: 'static',
    marginTop: spacing.sm,
    '& .MuiListItemText-primary': { color: palette.grayDark.main },
    '& .MuiListItemSecondaryAction-root': { right: spacing.sm },
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
  connections: ({ active }: StyleProps) => ({
    borderTopRightRadius: active ? 0 : undefined,
    borderBottomRightRadius: active ? 0 : undefined,
    paddingRight: active ? spacing.xs : undefined,
  }),
  active: {
    fontWeight: 500,
  },
  footer: ({ insets }: StyleProps) => ({
    position: 'fixed',
    bottom: spacing.lg + insets.bottom,
    backgroundColor: palette.grayLighter.main,
    zIndex: 3,
  }),
}))
