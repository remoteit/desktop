import brand from '@common/brand/config'
import browser from '../services/browser'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { Dispatch, State } from '../store'
import { isRemoteUI } from '../helpers/uiHelper'
import { getHasPartner } from '../models/partnerStats'
import { getProductModel } from '../selectors/products'
import { selectDefaultSelectedPage } from '../selectors/ui'
import { useChatToggle } from './useChatEnabled'
import { useDeviceSessions } from './useDeviceSessions'
import { useServiceShortcutsSupport } from './useServiceShortcutsSupport'
import { useThisDevice, useThisDevicePage } from './useThisDevice'
import {
  NAV_PAGES,
  NavGates,
  NavPageId,
  VisibleSection,
  navPageAt,
  navSectionAt,
  navSections,
  sectionLanding,
} from '../helpers/navSections'

export function useNavGates(remoteUI: boolean): NavGates {
  const thisDevicePage = useThisDevicePage()
  const thisDevice = useThisDevice()
  const deviceSessions = useDeviceSessions()
  const serviceShortcuts = useServiceShortcutsSupport(!remoteUI)
  const partner = useSelector(getHasPartner)
  const chat = useChatToggle()
  return {
    thisDevice: !!(thisDevicePage && thisDevice),
    services: !!serviceShortcuts && serviceShortcuts !== 'ERROR' && serviceShortcuts.available,
    deviceSessions,
    publicAddresses: deviceSessions,
    partner,
    connectAi: brand.name === 'remoteit',
    agent: chat.show,
  }
}

export function useNavSections() {
  const history = useHistory()
  const { pathname } = useLocation()
  const remoteUI = useSelector(isRemoteUI)
  const gates = useNavGates(remoteUI)
  const products = useSelector((state: State) => getProductModel(state).all.length)
  const defaultSelectedPage = useSelector(selectDefaultSelectedPage)
  const rootPaths = useSelector((state: State) => !browser.isElectron && state.ui.layout.hideSidebar)
  const chat = useChatToggle()
  const sectionPage = useSelector((state: State) => state.ui.sectionPage)
  const sections = navSections(gates)
  const landing = (section: VisibleSection) => sectionLanding(section, { products }, sectionPage[section.id])

  const pageTo = (id: NavPageId): string | undefined => {
    const { to, remember } = NAV_PAGES[id]
    return to && remember && !rootPaths ? defaultSelectedPage[to] || to : to
  }

  const open = (id: NavPageId) => {
    if (id === 'agent') {
      if (!chat.open) chat.toggle()
      return
    }
    const to = pageTo(id)
    if (to) history.push(to)
  }

  return {
    remoteUI,
    gates,
    sections,
    page: navPageAt(sections, pathname),
    section: navSectionAt(sections, pathname),
    pageTo,
    open,
    landing,
    openSection: (section: VisibleSection) => open(landing(section)),
  }
}

export function useRememberSectionPage() {
  const { ui } = useDispatch<Dispatch>()
  const { pathname } = useLocation()
  const remoteUI = useSelector(isRemoteUI)
  const sections = navSections(useNavGates(remoteUI))
  const sectionPage = useSelector((state: State) => state.ui.sectionPage)
  const page = navPageAt(sections, pathname)
  const section = navSectionAt(sections, pathname)

  useEffect(() => {
    if (!page || !section || section.pages.length < 2 || sectionPage[section.id] === page) return
    ui.setPersistent({ sectionPage: { ...sectionPage, [section.id]: page } })
  }, [page, section?.id])
}
