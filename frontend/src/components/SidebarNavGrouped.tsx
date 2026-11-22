import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMobile } from '../hooks/useMobile'
import browser from '../services/browser'
import { useTranslation } from 'react-i18next'
import { selectLimitsLookup, selectOrganization } from '../selectors/organizations'
import { selectDefaultSelectedPage } from '../selectors/ui'
import { selectActiveAccountId } from '../selectors/accounts'
import { getProductModel } from '../selectors/products'
import { selectScripts } from '../selectors/scripting'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Box, Badge, List, Divider, Tooltip, Chip, Collapse, ListItemButton, ListItemText, Theme } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { UpgradeBanner } from './UpgradeBanner'
import { ResellerLogo } from './ResellerLogo'
import { ListItemLink } from './ListItemLink'
import { SidebarNav } from './SidebarNav'
import { Icon } from './Icon'
import { isRemoteUI } from '../helpers/uiHelper'
import { useCounts } from '../hooks/useCounts'
import { getLocale } from '../helpers/dateHelper'
import { spacing } from '../styling'
import { getHasPartner } from '../models/partnerStats'
import { useThisDevice, useThisDevicePage } from '../hooks/useThisDevice'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useServiceShortcutsSupport } from '../hooks/useServiceShortcutsSupport'
import {
  NavItemId,
  NavGroupId,
  NavSignals,
  classicNavItems,
  navGroups,
  activeNavGroup,
  navGroupOpen,
  navGroupKey,
} from '../helpers/navGroups'

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

const headerSx = (theme: Theme) => ({
  marginTop: `${spacing.sm}px`,
  paddingTop: 0.25,
  paddingBottom: 0.25,
  '& .MuiListItemText-primary, &:hover .MuiListItemText-primary': {
    color: theme.palette.grayDark.main,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 500,
  },
  '& svg': { color: theme.palette.grayDark.main },
})

export const SidebarNavGrouped: React.FC = () => {
  const remoteUI = useSelector(isRemoteUI)
  return remoteUI ? <SidebarNav /> : <GroupedNav />
}

const GroupedNav: React.FC = () => {
  const counts = useCounts()
  const reseller = useSelector((state: State) => state.user.reseller)
  const defaultSelectedPage = useSelector(selectDefaultSelectedPage)
  const limits = useSelector(selectLimitsLookup)
  const insets = useSelector((state: State) => state.ui.layout.insets)
  const rootPaths = useSelector((state: State) => !browser.isElectron && state.ui.layout.hideSidebar)
  const saved = useSelector((state: State) => state.ui.accordion)
  const mobile = useMobile()
  const dispatch = useDispatch<Dispatch>()
  const pathname = path => (rootPaths ? path : defaultSelectedPage[path] || path)
  const location = useLocation()
  const { t } = useTranslation()

  const hasPartner = useSelector(getHasPartner)
  const thisDevicePage = useThisDevicePage()
  const thisDevice = useThisDevice()
  const deviceSessions = useDeviceSessions()
  const serviceShortcuts = useServiceShortcutsSupport(true)

  const signals: NavSignals = {
    deviceSessions,
    devices: counts.devices,
    networks: useSelector((state: State) => (state.networks.initialized ? counts.networks : undefined)),
    products: useSelector((state: State) => {
      const model = getProductModel(state)
      return model.initialized ? model.all.length : undefined
    }),
    scripts: useSelector((state: State) =>
      state.files.all[selectActiveAccountId(state)] ? selectScripts(state).length : undefined
    ),
    organization: useSelector((state: State) => {
      if (!state.organization.initialized) return undefined
      const organization = selectOrganization(state)
      return !!organization.id || organization.members.length > 0
    }),
  }

  const groups = navGroups(
    classicNavItems({
      thisDevice: !!(thisDevicePage && thisDevice),
      mobile,
      services: !!serviceShortcuts && serviceShortcuts !== 'ERROR' && serviceShortcuts.available,
      deviceSessions,
      partner: hasPartner,
    })
  )
  const active = activeNavGroup(groups, location.pathname)
  const [collapsedHere, setCollapsedHere] = useState<{ id: NavGroupId; at: string }>()

  const toggle = (id: NavGroupId, open: boolean) => {
    if (id === active) setCollapsedHere(open ? { id, at: location.pathname } : undefined)
    dispatch.ui.accordion({ [navGroupKey(id)]: !open })
  }

  const item = (id: NavItemId) => {
    switch (id) {
      case 'thisDevice':
        return <ListItemLocation title={t('nav.thisDevice', 'This Device')} icon="laptop" to="/this-device" dense />
      case 'connections':
        return (
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
        )
      case 'devices':
        return (
          <ListItemLocation title={t('nav.devices', 'Devices')} icon="router" to="/devices" match="/devices" dense>
            {!!counts.devices && (
              <Tooltip title={t('nav.totalDevices', 'Total Devices')} placement="top" arrow>
                <Chip size="small" label={counts.devices.toLocaleString(getLocale())} />
              </Tooltip>
            )}
          </ListItemLocation>
        )
      case 'networks':
        return (
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
        )
      case 'services':
        return (
          <ListItemLocation
            title={t('nav.services', 'Services')}
            icon="network-wired"
            to="/services"
            match="/services"
            dense
          />
        )
      case 'exits':
        return <ListItemLocation title={t('nav.exits', 'Exits')} icon="door-open" to="/exits" match="/exits" dense />
      case 'proxies':
        return (
          <ListItemLocation title={t('nav.proxies', 'Proxies')} icon="server" to="/proxies" match="/proxies" dense />
        )
      case 'scripting':
        return (
          <ListItemLocation
            title={t('nav.scripting', 'Scripting')}
            to={pathname('/scripts')}
            icon="scripting"
            match={['/script', '/scripts', '/runs']}
            dense
          />
        )
      case 'apps':
        return <ListItemLocation title={t('nav.apps', 'Apps')} to="/apps" match="/apps" icon="cubes" dense />
      case 'products':
        return (
          <ListItemLocation
            title={t('nav.products', 'Products')}
            to="/products"
            match="/products"
            icon="conveyor-belt-boxes"
            dense
          />
        )
      case 'organization':
        return (
          <ListItemLocation
            title={t('nav.organization', 'Organization')}
            to="/organization"
            icon="industry-alt"
            dense
          />
        )
      case 'partnerStats':
        return (
          <ListItemLocation
            title={t('nav.partnerStats', 'Partner Stats')}
            to="/partner-stats"
            icon="chart-pie"
            dense
            onClick={() => dispatch.partnerStats.fetchIfEmpty()}
          />
        )
      case 'logs':
        return <ListItemLocation title={t('nav.logs', 'Logs')} to="/logs" icon="rectangle-history" dense exactMatch />
    }
  }

  return (
    <List sx={listSx}>
      {groups.map(group => {
        const isActive = group.id === active
        const here = isActive && collapsedHere?.id === group.id && collapsedHere.at === location.pathname
        const open = navGroupOpen(group, signals, saved, isActive, here)
        const items = group.items.map(id => <React.Fragment key={id}>{item(id)}</React.Fragment>)
        if (!group.header) return <React.Fragment key={group.id}>{items}</React.Fragment>
        const panel = `nav-group-${group.id}`
        return (
          <React.Fragment key={group.id}>
            <ListItemButton
              dense
              sx={headerSx}
              aria-expanded={open}
              aria-controls={panel}
              data-nav-group={group.id}
              onClick={() => toggle(group.id, open)}
            >
              <ListItemText primary={group.label(t)} />
              <Icon name={open ? 'chevron-down' : 'chevron-right'} size="xs" fixedWidth />
            </ListItemButton>
            <Collapse in={open} id={panel} timeout="auto">
              {items}
            </Collapse>
          </React.Fragment>
        )
      })}
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
            title={t('nav.feedback', 'Feedback')}
            onClick={() => dispatch.feedback.reset()}
            to="/feedback"
            icon="message"
            dense
          />
        ) : (
          <ListItemLink
            title={t('nav.supportForum', 'Support Forum')}
            href="https://link.remote.it/forum"
            icon="comments"
            dense
          />
        )}
        <ListItemLocation
          title={t('nav.settings', 'Settings')}
          icon="sliders-h"
          to="/settings"
          match="/settings"
          dense
        />
      </Box>
    </List>
  )
}
