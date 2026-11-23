import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { List } from '@mui/material'
import { State } from '../store'
import { Container } from './Container'
import { ListItemLocation } from './ListItemLocation'
import { PageHeading } from './PageTitle'
import { useCounts } from '../hooks/useCounts'
import { useNavSections, useSectionList } from '../hooks/useNavSections'
import { useAccountExits, useAccountProxies } from '../hooks/useAccountExits'
import { selectDeviceModelAttributes, selectVisibleDevices } from '../selectors/devices'
import { getProductModel } from '../selectors/products'
import { selectScripts } from '../selectors/scripting'
import { selectOrganization } from '../selectors/organizations'
import { NAV_PAGES, NavPageId, VisibleSection, navPageLabel } from '../helpers/navSections'

function useDevicesState() {
  const { t } = useTranslation()
  const { total, initialized, searched, filter } = useSelector(selectDeviceModelAttributes)
  const devices = useSelector(selectVisibleDevices)
  if (!initialized) return
  if (searched || filter !== 'all' || devices.length < total)
    return t('sectionPages.devices', {
      count: total,
      defaultValue_one: '{{count}} device',
      defaultValue_other: '{{count}} devices',
    })
  return t('sectionPages.devicesOnline', {
    count: total,
    online: devices.filter(device => device.state === 'active').length,
    defaultValue_one: '{{count}} device, {{online}} online',
    defaultValue_other: '{{count}} devices, {{online}} online',
  })
}

function useConnectionsState() {
  const { t } = useTranslation()
  const { active } = useCounts()
  return active
    ? t('sectionPages.connectionsOpen', { count: active, defaultValue: '{{count}} open' })
    : t('sectionPages.connectionsNone', 'None open')
}

function useNetworksState() {
  const { t } = useTranslation()
  const { networks } = useCounts()
  const initialized = useSelector((state: State) => state.networks.initialized)
  if (!initialized) return
  return t('sectionPages.networks', {
    count: networks,
    defaultValue_one: '{{count}} network',
    defaultValue_other: '{{count}} networks',
  })
}

function useExitsState() {
  const { t } = useTranslation()
  const exits = useAccountExits.useCached()
  if (!exits || typeof exits !== 'object' || !exits.own.length) return
  const on = exits.own.filter(exit => exit.offered).length
  return on ? t('sectionPages.exitsOn', { count: on, defaultValue: '{{count}} on' }) : t('sectionPages.exitsOff', 'Off')
}

function useProxiesState() {
  const { t } = useTranslation()
  const proxies = useAccountProxies.useCached()
  if (!Array.isArray(proxies)) return
  return t('sectionPages.proxies', {
    count: proxies.length,
    defaultValue_one: '{{count}} server',
    defaultValue_other: '{{count}} servers',
  })
}

function useProductsState() {
  const { t } = useTranslation()
  const { initialized, all } = useSelector(getProductModel)
  if (!initialized) return
  return t('sectionPages.products', {
    count: all.length,
    defaultValue_one: '{{count}} product',
    defaultValue_other: '{{count}} products',
  })
}

function useScriptsState() {
  const { t } = useTranslation()
  const initialized = useSelector((state: State) => state.files.initialized)
  const scripts = useSelector(selectScripts)
  if (!initialized) return
  return t('sectionPages.scripts', {
    count: scripts.length,
    defaultValue_one: '{{count}} script',
    defaultValue_other: '{{count}} scripts',
  })
}

function useOrganizationState() {
  const { t } = useTranslation()
  const { id, members } = useSelector(selectOrganization)
  if (!id) return
  return t('sectionPages.members', {
    // members leaves out the owner, whom the Members page lists first
    count: members.length + 1,
    defaultValue_one: '{{count}} member',
    defaultValue_other: '{{count}} members',
  })
}

const noState = () => undefined

const PAGE_STATE: Partial<Record<NavPageId, () => string | undefined>> = {
  devices: useDevicesState,
  connections: useConnectionsState,
  networks: useNetworksState,
  exits: useExitsState,
  proxies: useProxiesState,
  products: useProductsState,
  scripting: useScriptsState,
  organization: useOrganizationState,
}

const PageRow: React.FC<{ id: NavPageId; onOpen: () => void }> = ({ id, onOpen }) => {
  const { t } = useTranslation()
  const nav = useNavSections()
  const state = (PAGE_STATE[id] || noState)()
  const page = NAV_PAGES[id]
  const current = nav.page === id
  return (
    <ListItemLocation
      icon={page.icon}
      title={navPageLabel(id, t)}
      subtitle={state}
      to={current ? undefined : nav.pageTo(id)}
      match={page.segments.map(segment => `/${segment}`)}
      onClick={() => {
        onOpen()
        if (!page.to) nav.open(id)
      }}
    />
  )
}

export const SectionPages: React.FC<{ section: VisibleSection }> = ({ section }) => {
  const { t } = useTranslation()
  const list = useSectionList()
  return (
    <Container gutterBottom header={<PageHeading>{section.label(t)}</PageHeading>}>
      <List
        component="nav"
        aria-label={section.label(t)}
        sx={{
          '& .MuiListItemButton-root': { minHeight: 60 },
          '& .MuiListItemText-secondary': { color: 'grayDark.main' },
        }}
      >
        {section.pages.map(id => (
          <PageRow key={id} id={id} onOpen={list.close} />
        ))}
      </List>
    </Container>
  )
}
