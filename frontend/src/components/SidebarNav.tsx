import React, { useState } from 'react'
import browser from '../services/browser'
import { makeStyles } from '@mui/styles'
import { MOBILE_WIDTH } from '../constants'
import { selectLimitsLookup } from '../selectors/organizations'
import { selectDefaultSelectedPage } from '../selectors/ui'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import {
  Box,
  Badge,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  Divider,
  Typography,
  Tooltip,
  Collapse,
  Chip,
  useMediaQuery,
} from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { UpgradeBanner } from './UpgradeBanner'
import { ResellerLogo } from './ResellerLogo'
import { ListItemLink } from './ListItemLink'
import { ExpandIcon } from './ExpandIcon'
import { isRemoteUI } from '../helpers/uiHelper'
import { useCounts } from '../hooks/useCounts'
import { spacing } from '../styling'

export const SidebarNav: React.FC = () => {
  const [more, setMore] = useState<boolean>()
  const counts = useCounts()
  const reseller = useSelector((state: State) => state.user.reseller)
  const defaultSelectedPage = useSelector(selectDefaultSelectedPage)
  const remoteUI = useSelector(isRemoteUI)
  const limits = useSelector(selectLimitsLookup)
  const insets = useSelector((state: State) => state.ui.layout.insets)
  const rootPaths = useSelector((state: State) => !browser.isElectron && state.ui.layout.hideSidebar)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles({ active: counts.active, insets })
  const pathname = path => (rootPaths ? path : defaultSelectedPage[path] || path)

  if (remoteUI)
    return (
      <List className={css.list}>
        <ListItemLocation title="This Device" to="/devices" match="/devices/:any?/:any?/:any?" icon="laptop" dense />
        <ListItemLocation title="Logs" to="/logs" icon="file-alt" dense />
      </List>
    )

  return (
    <List className={css.list}>
      {!mobile && (
        <>
          <ListItemLocation
            title="Connections"
            icon="arrow-right-arrow-left"
            to={pathname('/connections')}
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
          <ListItemLocation title="Devices" icon="router" to="/devices" match="/devices" dense>
            {!!counts.devices && (
              <ListItemSecondaryAction>
                <Tooltip title="Total Devices" placement="top" arrow>
                  <Chip size="small" label={counts.devices.toLocaleString()} />
                </Tooltip>
              </ListItemSecondaryAction>
            )}
          </ListItemLocation>
          <ListItemLocation title="Networks" icon="chart-network" to={pathname('/networks')} match="/networks" dense>
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
      <ListItemLocation title="Organization" to="/organization" icon="industry-alt" dense />
      <ListItemLocation title="Logs" to="/logs" icon="rectangle-history" dense exactMatch />
      <ListItemButton onClick={() => setMore(!more)} sx={{ marginTop: 2 }}>
        <Typography variant="subtitle2" color="grayDark.main" marginLeft={1}>
          More
          <ExpandIcon open={more} color="grayDark" />
        </Typography>
      </ListItemButton>
      <Collapse in={more}>
        <ListItemLink title="Scripting" href="https://link.remote.it/app/scripting" icon="scroll" dense />
        <ListItemLink title="Registrations" href="https://link.remote.it/app/registrations" icon="upload" dense />
        <ListItemLink title="Products" href="https://link.remote.it/app/products" icon="server" dense />
      </Collapse>
      <Box className={css.footer}>
        <UpgradeBanner />
        <ResellerLogo reseller={reseller} marginLeft={4} size="small">
          <Divider />
        </ResellerLogo>
        <ListItemLocation
          title="Announcements"
          to="/announcements"
          icon="bullhorn"
          badge={counts.unreadAnnouncements}
          dense
        />
        {limits.support > 10 ? (
          <ListItemLocation
            title="Contact"
            onClick={() => dispatch.feedback.reset()}
            to="/feedback"
            icon="envelope-open-text"
            dense
          />
        ) : (
          <ListItemLink title="Support Forum" href="https://link.remote.it/forum" icon="comments" dense />
        )}
        <ListItemLocation title="Settings" icon="sliders-h" to="/settings" match="/settings" dense />
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
    '& .MuiListItemText-primary': { color: palette.grayDark.main },
    '& .MuiListItemSecondaryAction-root': { right: spacing.sm },
    '& .MuiListItem-button:hover .MuiListItemText-primary': { color: palette.black.main },
    '& .MuiListItem-button:hover path': { color: palette.grayDarkest.main },
    '& .MuiDivider-root': { margin: `${spacing.md}px ${spacing.lg}px`, borderColor: palette.grayLight.main },
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
