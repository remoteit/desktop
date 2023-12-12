import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { MOBILE_WIDTH } from '../constants'
import { selectLimitsLookup } from '../selectors/organizations'
import { selectDefaultSelectedPage } from '../selectors/ui'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import {
  Box,
  Badge,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  Typography,
  Tooltip,
  Collapse,
  Chip,
  useMediaQuery,
} from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { ListItemLink } from './ListItemLink'
import { ExpandIcon } from './ExpandIcon'
import { isRemoteUI } from '../helpers/uiHelper'
import { useCounts } from '../hooks/useCounts'
import { spacing } from '../styling'

export const SidebarNav: React.FC = () => {
  const counts = useCounts()
  const { defaultSelectedPage, remoteUI, limits, insets } = useSelector((state: ApplicationState) => ({
    defaultSelectedPage: selectDefaultSelectedPage(state),
    remoteUI: isRemoteUI(state),
    limits: selectLimitsLookup(state),
    insets: state.ui.layout.insets,
  }))
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()
  const [more, setMore] = useState<boolean>()
  const css = useStyles({ active: counts.active, insets })
  const pathname = path => defaultSelectedPage[path] || path

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
      {!mobile && (
        <>
          <ListItemLocation
            title="Connections"
            icon="arrow-right-arrow-left"
            pathname={pathname('/connections')}
            match="/connections"
            dense
          >
            <ListItemSecondaryAction>
              {!!counts.active && !counts.memberships ? (
                <Tooltip
                  title={`${counts.connections.toLocaleString()} Connections - ${counts.active.toLocaleString()} Connected`}
                  placement="top"
                  arrow
                >
                  <Chip
                    size="small"
                    label={counts.active.toLocaleString()}
                    className={css.active}
                    variant="filled"
                    color="primary"
                  />
                </Tooltip>
              ) : (
                !!counts.connections && (
                  <Badge
                    variant={counts.active && counts.memberships ? 'dot' : undefined}
                    color="primary"
                    overlap="circular"
                  >
                    <Tooltip title={`${counts.connections.toLocaleString()} Idle Connections`} placement="top" arrow>
                      <Chip size="small" label={counts.connections.toLocaleString()} />
                    </Tooltip>
                  </Badge>
                )
              )}
            </ListItemSecondaryAction>
          </ListItemLocation>
          <ListItemLocation title="Devices" icon="router" pathname="/devices" match="/devices" dense>
            {!!counts.devices && (
              <ListItemSecondaryAction>
                <Tooltip title="Total Devices" placement="top" arrow>
                  <Chip size="small" label={counts.devices.toLocaleString()} />
                </Tooltip>
              </ListItemSecondaryAction>
            )}
          </ListItemLocation>
          <ListItemLocation
            title="Networks"
            icon="chart-network"
            pathname={pathname('/networks')}
            match="/networks"
            dense
          >
            <ListItemSecondaryAction>
              {!!counts.networks && (
                <Tooltip title="Total Networks" placement="top" arrow>
                  <Chip size="small" label={counts.networks.toLocaleString()} />
                </Tooltip>
              )}
            </ListItemSecondaryAction>
          </ListItemLocation>
        </>
      )}
      <ListItemLocation title="Organization" pathname="/organization" icon="industry-alt" dense />
      <ListItemLocation title="Logs" pathname="/logs" icon="file-alt" dense />
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
      <Box className={css.footer}>
        <ListItemLocation
          title="Notifications"
          pathname="/announcements"
          icon="bell"
          badge={counts.unreadAnnouncements}
          dense
        />
        {limits.support > 10 ? (
          <ListItemLocation
            title="Contact"
            onClick={() => dispatch.feedback.reset()}
            pathname="/feedback"
            icon="envelope-open-text"
            dense
          />
        ) : (
          <ListItemLink title="Support Forum" href="https://link.remote.it/forum" icon="comments" dense />
        )}
      </Box>
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
  active: {
    fontWeight: 500,
  },
  footer: ({ insets }: StyleProps) => ({
    width: '100%',
    position: 'fixed',
    bottom: insets.bottom || spacing.lg,
    backgroundColor: palette.grayLighter.main,
    zIndex: 3,
  }),
}))
