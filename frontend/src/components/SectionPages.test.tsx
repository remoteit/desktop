import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const flags = vi.hoisted(() => ({
  remoteUI: false,
  deviceSessions: true,
  chat: false,
  pathname: '/exits',
  phone: true,
  sectionList: undefined as { section: string; pathname: string } | undefined,
  exits: undefined as unknown,
  proxies: undefined as unknown,
  devices: { total: 30, initialized: true, searched: false, filter: 'all' },
  visible: [] as { state: string }[],
  active: 0,
  networks: 6,
  networksInitialized: true,
  members: [{}, {}, {}],
}))
const push = vi.hoisted(() => vi.fn())
const set = vi.hoisted(() => vi.fn())
const toggle = vi.hoisted(() => vi.fn())

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, text?: unknown, options?: Record<string, unknown>) => {
      const o = (typeof text === 'object' ? text : options) as Record<string, any> | undefined
      const template =
        typeof text === 'string'
          ? text
          : o?.count === 1
          ? o?.defaultValue_one ?? o?.defaultValue
          : o?.defaultValue_other ?? o?.defaultValue ?? key
      return String(template).replace(/{{(\w+)}}/g, (_: string, name: string) => String(o?.[name]))
    },
  }),
}))
vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) =>
    select({
      ui: { layout: { hideSidebar: true, showBottomMenu: flags.phone }, sectionList: flags.sectionList },
      networks: { initialized: flags.networksInitialized },
      files: { initialized: false },
    }),
  useDispatch: () => ({ ui: { set } }),
}))
vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useHistory: () => ({ push }),
  useLocation: () => ({ pathname: flags.pathname }),
}))
vi.mock('@mui/material', () => ({
  Box: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Typography: ({ children }: { children?: React.ReactNode }) => <h1>{children}</h1>,
  List: ({ children, 'aria-label': label }: { children?: React.ReactNode; 'aria-label'?: string }) => (
    <nav aria-label={label}>{children}</nav>
  ),
}))
vi.mock('./Title', () => ({ Title: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
vi.mock('./Container', () => ({
  Container: ({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('./ListItemLocation', () => ({
  ListItemLocation: (props: {
    title: string
    subtitle?: string
    icon?: string
    to?: string
    match?: string[]
    onClick?: () => void
  }) => (
    <a
      data-row={props.title}
      data-icon={props.icon}
      data-selected={String(!!props.match?.some(m => flags.pathname.startsWith(m)))}
      onClick={() => {
        props.onClick?.()
        if (props.to) push(props.to)
      }}
    >
      <span>{props.title}</span>
      {props.subtitle && <small>{props.subtitle}</small>}
    </a>
  ),
}))
vi.mock('@common/brand/config', () => ({ default: { name: 'remoteit' } }))
vi.mock('../services/browser', () => ({ default: { isElectron: false } }))
vi.mock('../helpers/uiHelper', () => ({ isRemoteUI: () => flags.remoteUI }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => flags.deviceSessions }))
vi.mock('../hooks/useServiceShortcutsSupport', () => ({ useServiceShortcutsSupport: () => undefined }))
vi.mock('../hooks/useThisDevice', () => ({ useThisDevice: () => null, useThisDevicePage: () => false }))
vi.mock('../hooks/useChatEnabled', () => ({ useChatToggle: () => ({ show: flags.chat, open: false, toggle }) }))
vi.mock('../hooks/useCounts', () => ({ useCounts: () => ({ active: flags.active, networks: flags.networks }) }))
vi.mock('../hooks/useAccountExits', () => ({
  useAccountExits: { useCached: () => flags.exits },
  useAccountProxies: { useCached: () => flags.proxies },
}))
vi.mock('../models/partnerStats', () => ({ getHasPartner: () => false }))
vi.mock('../selectors/products', () => ({ getProductModel: () => ({ all: [], initialized: false }) }))
vi.mock('../selectors/ui', () => ({ selectDefaultSelectedPage: () => ({}) }))
vi.mock('../selectors/devices', () => ({
  selectDeviceModelAttributes: () => flags.devices,
  selectVisibleDevices: () => flags.visible,
}))
vi.mock('../selectors/scripting', () => ({ selectScripts: () => [] }))
vi.mock('../selectors/organizations', () => ({ selectOrganization: () => ({ id: 'org', members: flags.members }) }))

import { SectionPages } from './SectionPages'
import { PageTitle } from './PageTitle'
import { useForgetSectionList, useNavSections, useSectionList } from '../hooks/useNavSections'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const defaults = { ...flags }

describe('the phone section list', () => {
  let root: Root
  let container: HTMLDivElement

  const render = (node: React.ReactNode, set: Partial<typeof flags> = {}) => {
    Object.assign(flags, defaults, set)
    act(() => root.render(<>{node}</>))
  }
  const rows = () => [...container.querySelectorAll('[data-row]')].map(row => row.getAttribute('data-row'))
  const row = (title: string) => container.querySelector(`[data-row="${title}"]`) as HTMLElement
  const state = (title: string) => row(title).querySelector('small')?.textContent
  const title = () => container.querySelector('h1')?.textContent

  const Section: React.FC = () => {
    const nav = useNavSections()
    return nav.section ? <SectionPages section={nav.section} /> : null
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    push.mockReset()
    set.mockReset()
    toggle.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it("lists the section's pages under its name, with their icons", () => {
    render(<Section />)
    expect(title()).toBe('Network')
    expect(rows()).toEqual(['Networks', 'Exits', 'Public addresses', 'Proxy servers'])
    expect(row('Exits').getAttribute('data-icon')).toBe('door-open')
    expect(row('Exits').getAttribute('data-selected')).toBe('true')
    expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe('Network')
  })

  it('gives each page one line of what the app already knows, and none where it knows nothing', () => {
    render(<Section />, {
      exits: { own: [{ offered: true }, { offered: true }, { offered: false }], shared: [] },
      proxies: [{}],
    })
    expect(state('Networks')).toBe('6 networks')
    expect(state('Exits')).toBe('2 on')
    expect(state('Public addresses')).toBeUndefined()
    expect(state('Proxy servers')).toBe('1 server')

    render(<Section />, { exits: { own: [{ offered: false }], shared: [] }, networksInitialized: false })
    expect(state('Exits')).toBe('Off')
    expect(state('Networks')).toBeUndefined()
    expect(state('Proxy servers')).toBeUndefined()
  })

  it('counts devices online only when the whole list is loaded', () => {
    render(<Section />, { pathname: '/devices', visible: [{ state: 'active' }, { state: 'inactive' }], devices: { ...defaults.devices, total: 2 } })
    expect(state('Devices')).toBe('2 devices, 1 online')
    expect(state('Connections')).toBe('None open')

    render(<Section />, { pathname: '/devices', visible: [{ state: 'active' }], active: 3 })
    expect(state('Devices')).toBe('30 devices')
    expect(state('Connections')).toBe('3 open')
  })

  it('counts the owner among the members', () => {
    render(<Section />, { pathname: '/organization' })
    expect(state('Organization')).toBe('4 members')
  })

  it('opens a page and closes the list', () => {
    render(<Section />)
    act(() => row('Public addresses').click())
    expect(push).toHaveBeenCalledWith('/public-addresses')
    expect(set).toHaveBeenCalledWith({ sectionList: undefined })
  })

  it('closes the list over the page it is on without opening it again', () => {
    render(<Section />)
    act(() => row('Exits').click())
    expect(push).not.toHaveBeenCalled()
    expect(set).toHaveBeenCalledWith({ sectionList: undefined })
  })

  it('opens the chat from the Agent row', () => {
    render(<Section />, { pathname: '/connect-ai', chat: true })
    act(() => row('Agent').click())
    expect(toggle).toHaveBeenCalled()
  })

  describe('shown', () => {
    let shown: ReturnType<typeof useSectionList> | undefined
    const Probe: React.FC = () => {
      shown = useSectionList()
      useForgetSectionList()
      return null
    }

    it('only on a phone, on the page it was opened over', () => {
      render(<Probe />, { sectionList: { section: 'network', pathname: '/exits' } })
      expect(shown?.section?.id).toBe('network')
      render(<Probe />, { sectionList: { section: 'network', pathname: '/exits' }, phone: false })
      expect(shown?.section).toBeUndefined()
      render(<Probe />, { sectionList: { section: 'network', pathname: '/networks' } })
      expect(shown?.section).toBeUndefined()
    })

    it('is forgotten once the page changes', () => {
      render(<Probe />, { sectionList: { section: 'network', pathname: '/exits' } })
      expect(set).not.toHaveBeenCalled()
      render(<Probe />, { sectionList: { section: 'network', pathname: '/exits' }, pathname: '/exits/e1' })
      expect(set).toHaveBeenCalledWith({ sectionList: undefined })
    })
  })

  describe('the page title', () => {
    it("is the page's own name, not its section's", () => {
      render(<PageTitle />)
      expect(title()).toBe('Exits')
      render(<PageTitle />, { pathname: '/networks', deviceSessions: false })
      expect(title()).toBe('Networks')
      render(<PageTitle />, { pathname: '/connect-ai' })
      expect(title()).toBe('Connect AI')
      render(<PageTitle panels={2} />, { pathname: '/networks/n1' })
      expect(title()).toBe('Networks')
    })

    it("is left to an item's own page, Remote UI, pages outside the sections and the open list", () => {
      render(<PageTitle />, { pathname: '/exits/new' })
      expect(title()).toBeUndefined()
      render(<PageTitle />, { pathname: '/logs', remoteUI: true })
      expect(title()).toBeUndefined()
      render(<PageTitle />, { pathname: '/settings' })
      expect(title()).toBeUndefined()
      render(<PageTitle />, { sectionList: { section: 'network', pathname: '/exits' } })
      expect(title()).toBeUndefined()
    })
  })
})
