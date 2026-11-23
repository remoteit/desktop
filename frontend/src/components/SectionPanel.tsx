import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, List, Typography } from '@mui/material'
import { State } from '../store'
import { ListItemLocation } from './ListItemLocation'
import { Container } from './Container'
import { Title } from './Title'
import { useCounts } from '../hooks/useCounts'
import { useNavSections } from '../hooks/useNavSections'
import { useAccountExits, useAccountProxies } from '../hooks/useAccountExits'
import { accountStore } from '../hooks/useAccountStore'
import { graphQLPublicAddresses } from '../services/graphQLPublicAddresses'
import { getDevices } from '../selectors/devices'
import { getProductModel } from '../selectors/products'
import { selectScripts } from '../selectors/scripting'
import { selectOrganization } from '../selectors/organizations'
import { NAV_PAGES, NavPageId } from '../helpers/navSections'
import { setSectionHome } from '../helpers/navVariant'
import { getLocale } from '../helpers/dateHelper'

export const SECTION_PANEL_WIDTH = 240
export const SECTION_RAIL_WIDTH = 88

const usePublicAddresses = accountStore(graphQLPublicAddresses)
const n = (value: number) => value.toLocaleString(getLocale())
const listed = <T,>(value: T[] | string | undefined) => (Array.isArray(value) ? value : undefined)

/* One muted line of live state per page, only where the app already holds it or one small read gets it. */
const PAGE_STATE: Partial<Record<NavPageId, () => string | undefined>> = {
  devices: () => {
    const { t } = useTranslation()
    const { devices } = useCounts()
    const online = useSelector((state: State) => getDevices(state).filter(d => d.state === 'active').length)
    if (!devices) return
    return t('sectionPanel.devices', '{{total}} · {{online}} online', { total: n(devices), online: n(online) })
  },
  connections: () => {
    const { t } = useTranslation()
    const { active } = useCounts()
    return active
      ? t('sectionPanel.connectionsOpen', '{{count}} open', { count: active })
      : t('sectionPanel.connectionsNone', 'none open')
  },
  networks: () => {
    const { t } = useTranslation()
    const { networks } = useCounts()
    return networks === 1
      ? t('sectionPanel.network', '1 network')
      : t('sectionPanel.networks', '{{count}} networks', { count: networks })
  },
  exits: () => {
    const { t } = useTranslation()
    const { value } = useAccountExits()
    if (!value || typeof value !== 'object') return
    const ready = value.own.filter(exit => exit.offered).length
    return t('sectionPanel.exits', '{{count}} on', { count: ready })
  },
  publicAddresses: () => {
    const { t } = useTranslation()
    const { value } = usePublicAddresses()
    if (!value || typeof value !== 'object') return
    const count = value.addresses.length
    return count === 1
      ? t('sectionPanel.address', '1 address')
      : t('sectionPanel.addresses', '{{count}} addresses', { count })
  },
  proxies: () => {
    const { t } = useTranslation()
    const { value } = useAccountProxies()
    const proxies = listed(value as any)
    if (!proxies) return
    const count = proxies.length
    return count === 1 ? t('sectionPanel.proxy', '1 server') : t('sectionPanel.proxies', '{{count}} servers', { count })
  },
  products: () => {
    const { t } = useTranslation()
    const count = useSelector((state: State) => getProductModel(state).all.length)
    return count === 1
      ? t('sectionPanel.product', '1 product')
      : t('sectionPanel.products', '{{count}} products', { count })
  },
  scripting: () => {
    const { t } = useTranslation()
    const count = useSelector((state: State) => selectScripts(state).length)
    return count === 1
      ? t('sectionPanel.script', '1 script')
      : t('sectionPanel.scripts', '{{count}} scripts', { count })
  },
  organization: () => {
    const { t } = useTranslation()
    const members = useSelector((state: State) => selectOrganization(state).members?.length || 0)
    const count = members && members + 1
    if (!count) return
    return count === 1
      ? t('sectionPanel.member', '1 member')
      : t('sectionPanel.members', '{{count}} members', { count })
  },
}

const none = () => undefined

const PageRow: React.FC<{ id: NavPageId; rail?: boolean }> = ({ id, rail }) => {
  const { t } = useTranslation()
  const nav = useNavSections()
  const state = (PAGE_STATE[id] || none)()
  const page = NAV_PAGES[id]
  const to = page.to && nav.pageTo(id)
  return (
    <ListItemLocation
      icon={page.icon}
      title={page.label(t)}
      subtitle={rail ? undefined : state}
      to={to}
      match={page.segments.map(segment => `/${segment}`)}
      onClick={() => {
        setSectionHome(false)
        if (!to) nav.open(id)
      }}
      dense
    />
  )
}

/* A section's pages as rows, the Settings page's own list: beside the chosen page, or on a phone in place of it. */
export const SectionPanel: React.FC<{ rail?: boolean; full?: boolean }> = ({ rail, full }) => {
  const { t } = useTranslation()
  const nav = useNavSections()
  const { section } = nav
  if (!section) return null

  const list = (
    <List
      sx={{
        '& .MuiListItemText-secondary': { color: 'grayDark.main', marginTop: 0.25 },
        '& .MuiListItemButton-root.Mui-selected .MuiListItemText-primary': { fontWeight: 500 },
        ...(rail && {
          '& .MuiListItemButton-root': {
            flexDirection: 'column',
            alignItems: 'center',
            width: 'calc(100% - 16px)',
            marginX: 1,
            paddingX: 0.5,
            paddingY: 1,
            marginBottom: 0.5,
          },
          '& .MuiListItemIcon-root': { minWidth: 0, justifyContent: 'center' },
          '& .MuiListItemText-root': { margin: 0, marginTop: 0.5 },
          '& .MuiListItemText-primary': { fontSize: 11, lineHeight: 1.3, textAlign: 'center' },
        }),
      }}
    >
      {section.pages.map(id => (
        <PageRow key={id} id={id} rail={rail} />
      ))}
    </List>
  )

  if (full)
    return (
      <Container
        gutterBottom
        header={
          <Box sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1 }}>
            <Typography variant="h2" component="h1">
              <Title>{section.label(t)}</Title>
            </Typography>
          </Box>
        }
      >
        {list}
      </Container>
    )

  return (
    <Box
      component="nav"
      aria-label={section.label(t)}
      sx={theme => ({
        width: rail ? SECTION_RAIL_WIDTH : SECTION_PANEL_WIDTH,
        minWidth: rail ? SECTION_RAIL_WIDTH : SECTION_PANEL_WIDTH,
        height: '100%',
        flexShrink: 0,
        borderRight: `1px solid ${theme.palette.grayLighter.main}`,
        paddingTop: '57px',
      })}
    >
      <Container
        gutterBottom
        integrated={rail}
        header={
          rail ? undefined : (
            <Box sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1 }}>
              <Typography variant="h2" component="h1">
                <Title>{section.label(t)}</Title>
              </Typography>
            </Box>
          )
        }
      >
        {list}
      </Container>
    </Box>
  )
}
