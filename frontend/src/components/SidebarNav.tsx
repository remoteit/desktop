import React from 'react'
import { useTranslation } from 'react-i18next'
import { selectLimitsLookup } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Link } from 'react-router-dom'
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Divider, Tooltip, Chip, Theme } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { UpgradeBanner } from './UpgradeBanner'
import { ResellerLogo } from './ResellerLogo'
import { ListItemLink } from './ListItemLink'
import { Quote } from './Quote'
import { Icon } from './Icon'
import { useCounts } from '../hooks/useCounts'
import { getLocale } from '../helpers/dateHelper'
import { spacing } from '../styling'
import { useNavSections } from '../hooks/useNavSections'
import { NAV_PAGES, NavPageId, NavSectionId, VisibleSection, sectionMatch, navPageLabel } from '../helpers/navSections'

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
  const limits = useSelector(selectLimitsLookup)
  const insets = useSelector((state: State) => state.ui.layout.insets)
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()
  const nav = useNavSections()

  if (nav.remoteUI)
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

  const count = (id: NavSectionId) => {
    const value = id === 'devices' ? counts.devices : id === 'network' ? counts.networks : undefined
    if (!value) return null
    const title = id === 'devices' ? t('nav.totalDevices', 'Total Devices') : t('nav.totalNetworks', 'Total Networks')
    return (
      <Tooltip title={title} placement="top" arrow>
        <Chip size="small" label={value.toLocaleString(getLocale())} />
      </Tooltip>
    )
  }

  const pages = (section: VisibleSection) => (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <Quote margin={null} noInset indent="listIcon" color="grayLight">
        <Box component="ul" aria-label={section.label(t)} sx={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {section.pages.map(id => (
            <li key={id}>
              <PageLink id={id} current={nav.page === id} to={NAV_PAGES[id].to && nav.pageTo(id)} onOpen={nav.open}>
                {id === 'connections' && !!counts.active && (
                  <Chip size="small" label={counts.active.toLocaleString(getLocale())} />
                )}
              </PageLink>
            </li>
          ))}
        </Box>
      </Quote>
    </Box>
  )

  return (
    <List sx={listSx}>
      {nav.sections.map(section => {
        const landing = nav.landing(section)
        const open = nav.section?.id === section.id && section.pages.length > 1
        return (
          <React.Fragment key={section.id}>
            <ListItemLocation
              title={section.label(t)}
              icon={section.icon}
              to={NAV_PAGES[landing].to && nav.pageTo(landing)}
              onClick={NAV_PAGES[landing].to ? undefined : () => nav.open(landing)}
              match={open ? [] : sectionMatch(section)}
              sx={open ? { '& .MuiListItemText-primary': { fontWeight: 500 } } : undefined}
              dense
            >
              {count(section.id)}
            </ListItemLocation>
            {open && pages(section)}
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

const PageLink: React.FC<{
  id: NavPageId
  current: boolean
  to?: string
  onOpen: (id: NavPageId) => void
  children?: React.ReactNode
}> = ({ id, current, to, onOpen, children }) => {
  const { t } = useTranslation()
  const props = to ? { component: Link, to } : { component: 'button', onClick: () => onOpen(id) }
  return (
    <ListItemButton
      {...props}
      selected={current}
      aria-current={current ? 'page' : undefined}
      dense
      sx={{
        marginLeft: `${spacing.xs}px`,
        width: `calc(100% - ${spacing.xs + spacing.md}px)`,
        paddingLeft: `${spacing.xs}px`,
        minHeight: 34,
        paddingY: 0.25,
      }}
    >
      <ListItemIcon sx={{ minWidth: 32 }}>
        <Icon name={NAV_PAGES[id].icon} size="base" fixedWidth />
      </ListItemIcon>
      <ListItemText primary={navPageLabel(id, t)} />
      {children}
    </ListItemButton>
  )
}
