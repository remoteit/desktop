import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const flags = vi.hoisted(() => ({
  pathname: '/exits',
  layout: { hideSidebar: true, singlePanel: true, showBottomMenu: true } as Record<string, boolean>,
  section: { id: 'network', pages: ['networks', 'exits', 'publicAddresses', 'proxies'] } as
    | { id: string; pages: string[] }
    | undefined,
  listShown: false,
}))
const openList = vi.hoisted(() => vi.fn())
const navigateUp = vi.hoisted(() => vi.fn())

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, text?: unknown) => (typeof text === 'string' ? text : key) }) }))
vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) =>
    select({ ui: { layout: flags.layout }, devices: {}, organization: {}, auth: {}, accounts: {} }),
}))
vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useLocation: () => ({ pathname: flags.pathname }),
}))
vi.mock('../../services/browser', () => ({ default: { isElectron: false, isMac: false, isMobile: false } }))
vi.mock('../../selectors/devices', () => ({ selectDeviceModelAttributes: () => ({ searched: false }) }))
vi.mock('../../selectors/organizations', () => ({ selectPermissions: () => [] }))
vi.mock('../../hooks/useMobile', () => ({ useMobile: () => true }))
vi.mock('../../hooks/useChatEnabled', () => ({ useChatToggle: () => ({ show: false }) }))
vi.mock('../../hooks/useNavigationUp', () => ({ default: () => navigateUp }))
vi.mock('../../hooks/useNavSections', () => ({
  useNavSections: () => ({ section: flags.section }),
  useSectionList: () => ({ section: flags.listShown ? flags.section : undefined, open: openList }),
}))
vi.mock('../Chat/ChatAgentGuide', () => ({ ChatAgentGuide: () => null }))
vi.mock('../HeaderDeviceOptionMenu', () => ({ HeaderDeviceOptionMenu: () => null }))
vi.mock('../UpgradeNotice', () => ({ UpgradeNotice: () => null }))
vi.mock('../../buttons/ColumnsButton', () => ({ ColumnsButton: () => null }))
vi.mock('../../buttons/RefreshButton', () => ({ RefreshButton: () => null }))
vi.mock('../GlobalSearch', () => ({ GlobalSearch: () => null }))
vi.mock('../../buttons/FilterButton', () => ({ FilterButton: () => <button data-filter /> }))
vi.mock('../../buttons/SidebarMenuButton', () => ({ SidebarMenuButton: () => <button data-menu /> }))
vi.mock('../PageTitle', () => ({ PageTitle: () => null }))
vi.mock('../Title', () => ({ Title: () => null }))
vi.mock('../../buttons/IconButton', () => ({
  IconButton: ({ title, icon, onClick }: { title?: string; icon?: string; onClick?: () => void }) => (
    <button data-icon={icon} title={title} onClick={onClick} />
  ),
}))

import { Header } from './Header'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const defaults = JSON.parse(JSON.stringify(flags))

describe('Header on a phone', () => {
  let root: Root
  let container: HTMLDivElement

  const render = (set: Partial<typeof flags> = {}) => {
    Object.assign(flags, JSON.parse(JSON.stringify(defaults)), set)
    act(() =>
      root.render(
        <MemoryRouter key={flags.pathname} initialEntries={[flags.pathname]}>
          <Header />
        </MemoryRouter>
      )
    )
  }
  const back = () => container.querySelector('[data-icon="chevron-left"]') as HTMLButtonElement | null
  const menu = () => container.querySelector('[data-menu]')

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    openList.mockReset()
    navigateUp.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it("gives a section's page a back arrow to the section's list, in place of the menu", () => {
    render()
    expect(menu()).toBeNull()
    act(() => back()!.click())
    expect(openList).toHaveBeenCalledWith(flags.section)
    expect(navigateUp).not.toHaveBeenCalled()
  })

  it('shows the menu, not a back arrow, over the list itself', () => {
    render({ listShown: true })
    expect(back()).toBeNull()
    expect(menu()).not.toBeNull()
  })

  it('has no list to go back to for a section with one page', () => {
    render({ pathname: '/connect-ai', section: { id: 'ai', pages: ['connectAi'] } })
    expect(back()).toBeNull()
    expect(menu()).not.toBeNull()
  })

  it("keeps an item's back arrow going up, and Add device's going to Devices", () => {
    render({ pathname: '/exits/e1', layout: { hideSidebar: true, singlePanel: true, showBottomMenu: false } })
    act(() => back()!.click())
    expect(navigateUp).toHaveBeenCalled()
    expect(openList).not.toHaveBeenCalled()
    render({ pathname: '/add', section: { id: 'devices', pages: ['devices', 'connections'] } })
    expect(container.querySelectorAll('[data-icon="chevron-left"]').length).toBe(1)
    expect(openList).not.toHaveBeenCalled()
  })

  it('leaves the page actions off the list', () => {
    render({ pathname: '/devices', section: { id: 'devices', pages: ['devices', 'connections'] } })
    expect(container.querySelector('[data-filter]')).not.toBeNull()
    render({ pathname: '/devices', section: { id: 'devices', pages: ['devices', 'connections'] }, listShown: true })
    expect(container.querySelector('[data-filter]')).toBeNull()
  })

  it('has no back arrow to a list on a computer', () => {
    render({ layout: { hideSidebar: false, singlePanel: false, showBottomMenu: false } })
    expect(back()).toBeNull()
  })
})
