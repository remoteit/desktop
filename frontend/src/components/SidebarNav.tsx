import React from 'react'
import { useTranslation } from 'react-i18next'
import { selectLimitsLookup } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Link } from 'react-router-dom'
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Chip,
  Theme,
  SxProps,
} from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { UpgradeBanner } from './UpgradeBanner'
import { ResellerLogo } from './ResellerLogo'
import { ListItemLink } from './ListItemLink'
import { Icon } from './Icon'
import { useCounts } from '../hooks/useCounts'
import { getLocale } from '../helpers/dateHelper'
import { spacing, radius } from '../styling'
import { NAV_STYLE, NavStyle } from '../helpers/navStyle'
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

const INSET = spacing.md - spacing.xs
const LIST_ROW_GAP = 2
const CARET = 7
const SCREENS = {
  b2: { light: 'rgba(0, 16, 26, 0.045)', dark: 'rgba(0, 0, 0, 0.18)' },
  b3: { light: 'rgba(255, 255, 255, 0.6)', dark: 'rgba(255, 255, 255, 0.045)' },
}

const RuleCaret: React.FC = () => (
  <Box
    component="li"
    aria-hidden
    sx={theme => ({
      position: 'absolute',
      top: -CARET,
      left: 0,
      right: 0,
      height: CARET,
      display: 'flex',
      alignItems: 'flex-end',
      color: theme.palette.grayLight.main,
      '& > span': { flex: 1, borderBottom: '1px solid currentColor' },
      '& > span:first-of-type': { flex: 'none', width: ICON_CENTER - spacing.md - CARET },
    })}
  >
    <span />
    <svg width={CARET * 2} height={CARET} viewBox={`0 0 ${CARET * 2} ${CARET}`} style={{ display: 'block' }}>
      <path
        d={`M0 ${CARET - 0.5} H0.5 L${CARET} 1 L${CARET * 2 - 0.5} ${CARET - 0.5} H${CARET * 2}`}
        fill="none"
        stroke="currentColor"
      />
    </svg>
    <span />
  </Box>
)
const ROW_IN_BOX = {
  marginLeft: `${spacing.xs}px`,
  marginRight: `${spacing.xs}px`,
  width: `calc(100% - ${spacing.xs * 2}px)`,
}
const ICON_CENTER = spacing.md + 28

const boxColor = (theme: Theme, dark: boolean) => (dark ? theme.palette.grayLight.main : theme.palette.white.main)

const groupSx =
  (style: NavStyle, dark: boolean): SxProps<Theme> =>
  theme => {
    const base = { listStyle: 'none', position: 'relative' as const }
    if (style === 'a')
      return {
        ...base,
        marginX: `${INSET}px`,
        marginY: `${spacing.xxs}px`,
        paddingY: `${spacing.xxs}px`,
        borderRadius: `${radius.lg - 4}px`,
        backgroundColor: boxColor(theme, dark),
        boxShadow: dark ? undefined : `0 0 0 1px ${theme.palette.grayLight.main}`,
        '& .MuiListItemButton-root': ROW_IN_BOX,
      }
    if (style === 'e')
      return {
        ...base,
        marginBottom: `${spacing.xs}px`,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: `${spacing.xs}px`,
          top: `${LIST_ROW_GAP}px`,
          bottom: `${LIST_ROW_GAP}px`,
          width: 3,
          borderRadius: 2,
          backgroundColor: theme.palette.primary.main,
        },
      }
    return base
  }

const pagesSx =
  (style: NavStyle, dark: boolean): SxProps<Theme> =>
  theme => {
    const base = { listStyle: 'none', margin: 0, padding: 0, position: 'relative' as const }
    if (style === 'b')
      return {
        ...base,
        marginX: `${INSET}px`,
        marginTop: `${spacing.xs + 1}px`,
        marginBottom: `${spacing.xs}px`,
        paddingY: `${spacing.xxs}px`,
        borderRadius: `${radius.lg - 4}px`,
        backgroundColor: boxColor(theme, dark),
        boxShadow: dark ? undefined : `0 0 0 1px ${theme.palette.grayLight.main}`,
        '& .MuiListItemButton-root': ROW_IN_BOX,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -6,
          left: ICON_CENTER - INSET - 6,
          width: 12,
          height: 12,
          transform: 'rotate(45deg)',
          borderTopLeftRadius: 2,
          backgroundColor: boxColor(theme, dark),
          boxShadow: dark ? undefined : `-1px -1px 0 0 ${theme.palette.grayLight.main}`,
        },
      }
    if (style === 'b2' || style === 'b3') {
      const screen = SCREENS[style][dark ? 'dark' : 'light']
      return {
        ...base,
        marginX: `${INSET}px`,
        marginTop: `${CARET + 1}px`,
        marginBottom: `${spacing.xs}px`,
        paddingY: `${spacing.xxs}px`,
        borderRadius: `${radius.lg - 4}px`,
        backgroundColor: screen,
        '& .MuiListItemButton-root': ROW_IN_BOX,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -CARET,
          left: ICON_CENTER - INSET - CARET,
          width: CARET * 2,
          height: CARET,
          clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
          backgroundColor: screen,
        },
      }
    }
    if (style === 'c2')
      return {
        ...base,
        marginX: `${spacing.md}px`,
        marginTop: `${spacing.xxs + CARET}px`,
        marginBottom: `${spacing.md}px`,
        paddingY: `${spacing.xxs}px`,
        borderBottom: `1px solid ${theme.palette.grayLight.main}`,
        '& .MuiListItemButton-root': { marginLeft: 0, marginRight: 0, width: '100%' },
      }
    if (style === 'c')
      return {
        ...base,
        marginX: `${spacing.md}px`,
        marginTop: `${spacing.xxs}px`,
        marginBottom: `${spacing.md}px`,
        paddingY: `${spacing.xxs}px`,
        borderTop: `1px solid ${theme.palette.grayLight.main}`,
        borderBottom: `1px solid ${theme.palette.grayLight.main}`,
        '& .MuiListItemButton-root': { marginLeft: 0, marginRight: 0, width: '100%' },
      }
    if (style === 'd')
      return {
        ...base,
        marginBottom: `${spacing.sm}px`,
        '& .MuiListItemButton-root': { minHeight: 30, paddingY: 0 },
        '& .MuiListItemText-primary': { fontSize: '0.8125rem', fontWeight: 400 },
        '& .MuiListItemButton-root:not(.Mui-selected) .MuiListItemIcon-root': { color: theme.palette.gray.main },
      }
    return base
  }

export const SidebarNav: React.FC = () => {
  const counts = useCounts()
  const reseller = useSelector((state: State) => state.user.reseller)
  const limits = useSelector(selectLimitsLookup)
  const insets = useSelector((state: State) => state.ui.layout.insets)
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()
  const nav = useNavSections()
  const dark = useSelector((state: State) => state.ui.themeDark)

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
    <Box component="ul" aria-label={section.label(t)} sx={pagesSx(NAV_STYLE, dark)}>
      {NAV_STYLE === 'c2' && <RuleCaret />}
      {section.pages.map(id => (
        <li key={id}>
          <PageLink
            id={id}
            current={nav.page === id}
            to={NAV_PAGES[id].to && nav.pageTo(id)}
            onOpen={nav.open}
            quiet={NAV_STYLE === 'd'}
          >
            {id === 'connections' && !!counts.active && (
              <Chip size="small" label={counts.active.toLocaleString(getLocale())} />
            )}
          </PageLink>
        </li>
      ))}
    </Box>
  )

  return (
    <List sx={listSx}>
      {nav.sections.map(section => {
        const landing = nav.landing(section)
        const open = nav.section?.id === section.id && section.pages.length > 1
        const head = (
          <ListItemLocation
            title={section.label(t)}
            icon={section.icon}
            to={NAV_PAGES[landing].to && nav.pageTo(landing)}
            onClick={NAV_PAGES[landing].to ? undefined : () => nav.open(landing)}
            match={open ? [] : sectionMatch(section)}
            sx={open ? { '& .MuiListItemText-primary': { fontWeight: NAV_STYLE === 'd' ? 700 : 500 } } : undefined}
            dense
          >
            {count(section.id)}
          </ListItemLocation>
        )
        if (!open) return <React.Fragment key={section.id}>{head}</React.Fragment>
        return (
          <Box component="li" key={section.id} sx={groupSx(NAV_STYLE, dark)}>
            {head}
            {pages(section)}
          </Box>
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
  quiet?: boolean
  children?: React.ReactNode
}> = ({ id, current, to, onOpen, quiet, children }) => {
  const { t } = useTranslation()
  const props = to ? { component: Link, to } : { component: 'button', onClick: () => onOpen(id) }
  return (
    <ListItemButton
      {...props}
      selected={current}
      aria-current={current ? 'page' : undefined}
      dense
      sx={{ minHeight: 34, paddingY: 0.25 }}
    >
      <ListItemIcon>
        <Icon name={NAV_PAGES[id].icon} size={quiet ? 'sm' : 'base'} fixedWidth />
      </ListItemIcon>
      <ListItemText primary={navPageLabel(id, t)} />
      {children}
    </ListItemButton>
  )
}
