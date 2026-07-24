import React from 'react'
import browser from '../services/browser'
import { useTranslation } from 'react-i18next'
import { MOBILE_WIDTH } from '../constants'
import { selectLimitsLookup } from '../selectors/organizations'
import { selectDefaultSelectedPage } from '../selectors/ui'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import {
  Box,
  Badge,
  List,
  Divider,
  Tooltip,
  Chip,
  Theme,
  useMediaQuery,
} from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { UpgradeBanner } from './UpgradeBanner'
import { ResellerLogo } from './ResellerLogo'
import { ListItemLink } from './ListItemLink'
import { isRemoteUI } from '../helpers/uiHelper'
import { useCounts } from '../hooks/useCounts'
import { getLocale } from '../helpers/dateHelper'
import { spacing } from '../styling'
import { getHasPartner } from '../models/partnerStats'

const listSx = (theme: Theme) => ({
  position: 'static',
  '& .MuiBadge-badge': { right: 12 },
  '& .MuiListItemIcon-root': { color: theme.palette.grayDark.main },
  '& .MuiListItemText-primary': { color: theme.palette.grayDarkest.main },
  '& .MuiChip-root': { marginRight: `${spacing.sm}px` },
  '& .MuiListItemButton-root:hover .MuiListItemText-primary': { color: theme.palette.black.main },
  '& .MuiDivider-root': { margin: `${spacing.md}px ${spacing.lg}px`, borderColor: theme.palette.grayLight.main },
  '& .MuiListItemButton-root.Mui-selected, & .MuiListItemButton-root.Mui-selected:hover': {
    backgroundColor: theme.palette.primaryLighter.main,
    '& .MuiListItemIcon-root': { color: theme.palette.grayDarker.main },
    '& .MuiListItemText-primary': { color: theme.palette.black.main, fontWeight: 500 },
  },
})

export const SidebarNav: React.FC = () => {
  const counts = useCounts()
  const reseller = useSelector((state: State) => state.user.reseller)
  const defaultSelectedPage = useSelector(selectDefaultSelectedPage)
  const remoteUI = useSelector(isRemoteUI)
  const limits = useSelector(selectLimitsLookup)
  const insets = useSelector((state: State) => state.ui.layout.insets)
  const rootPaths = useSelector((state: State) => !browser.isElectron && state.ui.layout.hideSidebar)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()
  const pathname = path => (rootPaths ? path : defaultSelectedPage[path] || path)
  const { t } = useTranslation()

  const hasPartner = useSelector(getHasPartner)

  if (remoteUI)
    return (
      <List sx={listSx}>
        <ListItemLocation
          title={t('nav.thisDevice', 'This Device')}
          to="/devices"
          match="/devices/:any?/:any?/:any?"
          icon="laptop"
          dense
        />
        <ListItemLocation title={t('nav.logs', 'Logs')} to="/logs" icon="file-alt" dense />
      </List>
    )

  return (
    <List sx={listSx}>
      {!mobile && (
        <>
          <ListItemLocation
            title={t('nav.connections', 'Connections')}
            icon="arrow-right-arrow-left"
            to={pathname('/connections')}
            match="/connections"
            dense
          >
            {!!counts.active && !counts.memberships ? (
              <Tooltip
                title={t('nav.connectionsTooltip', {
                  connections: counts.connections.toLocaleString(getLocale()),
                  active: counts.active.toLocaleString(getLocale()),
                  defaultValue: '{{connections}} Connections - {{active}} Connected',
                })}
                placement="top"
                arrow
              >
                <Chip
                  size="small"
                  label={counts.active.toLocaleString(getLocale())}
                  sx={{ fontWeight: 500 }}
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
                  <Tooltip
                    title={t('nav.idleConnections', {
                      connections: counts.connections.toLocaleString(getLocale()),
                      defaultValue: '{{connections}} Idle Connections',
                    })}
                    placement="top"
                    arrow
                  >
                    <Chip size="small" label={counts.connections.toLocaleString(getLocale())} />
                  </Tooltip>
                </Badge>
              )
            )}
          </ListItemLocation>
          <ListItemLocation title={t('nav.devices', 'Devices')} icon="router" to="/devices" match="/devices" dense>
            {!!counts.devices && (
              <Tooltip title={t('nav.totalDevices', 'Total Devices')} placement="top" arrow>
                <Chip size="small" label={counts.devices.toLocaleString(getLocale())} />
              </Tooltip>
            )}
          </ListItemLocation>
          <ListItemLocation
            title={t('nav.networks', 'Networks')}
            icon="chart-network"
            to={pathname('/networks')}
            match="/networks"
            dense
          >
            {!!counts.networks && (
              <Tooltip title={t('nav.totalNetworks', 'Total Networks')} placement="top" arrow>
                <Chip size="small" label={counts.networks.toLocaleString(getLocale())} />
              </Tooltip>
            )}
          </ListItemLocation>
        </>
      )}
      <ListItemLocation
        title={t('nav.scripting', 'Scripting')}
        to={pathname('/scripts')}
        icon="scripting"
        match={['/script', '/scripts', '/runs']}
        dense
      />
      <ListItemLocation title={t('nav.products', 'Products')} to="/products" match="/products" icon="conveyor-belt-boxes" dense />
      <ListItemLocation title={t('nav.organization', 'Organization')} to="/organization" icon="industry-alt" dense />
      {hasPartner && (
        <ListItemLocation
          title={t('nav.partnerStats', 'Partner Stats')}
          to="/partner-stats"
          icon="chart-pie"
          dense
          onClick={() => dispatch.partnerStats.fetchIfEmpty()}
        />
      )}
      <ListItemLocation title={t('nav.logs', 'Logs')} to="/logs" icon="rectangle-history" dense exactMatch />
      <Box
        sx={theme => ({
          width: '100%',
          position: 'fixed',
          bottom: insets.bottom || spacing.lg,
          backgroundColor: theme.palette.grayLighter.main,
          zIndex: 3,
        })}
      >
        <UpgradeBanner />
        <ResellerLogo reseller={reseller} marginLeft={4} size="small">
          <Divider />
        </ResellerLogo>
        <ListItemLocation
          title={t('nav.announcements', 'Announcements')}
          to="/announcements"
          icon="bullhorn"
          badge={counts.unreadAnnouncements}
          dense
        />
        {limits.support > 10 ? (
          <ListItemLocation
            title={t('nav.contact', 'Contact')}
            onClick={() => dispatch.feedback.reset()}
            to="/feedback"
            icon="envelope-open-text"
            dense
          />
        ) : (
          <ListItemLink title={t('nav.supportForum', 'Support Forum')} href="https://link.remote.it/forum" icon="comments" dense />
        )}
        <ListItemLocation title={t('nav.settings', 'Settings')} icon="sliders-h" to="/settings" match="/settings" dense />
      </Box>
    </List>
  )
}
