import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { apps, push, catalog } = vi.hoisted(() => ({ apps: { value: {} as any }, push: vi.fn(), catalog: vi.fn() }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../hooks/useDeviceApps', () => ({ useDeviceApps: () => apps.value }))
vi.mock('../services/graphQLAppCatalog', () => ({ graphQLAppCatalog: catalog }))
vi.mock('../services/graphQLDeviceApps', async () => ({
  ...(await import('../services/deviceAppsShared')),
  SCREENVIEW: 'remoteit.screenview',
}))
vi.mock('../components/Container', () => ({ Container: ({ header, children }: any) => <div>{header}{children}</div> }))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span data-title>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Link', () => ({ Link: ({ to, children }: any) => <a data-to={to}>{children}</a> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, children, onConfirm }: any) =>
    open ? (
      <div data-confirm>
        <span data-confirm-title>{title}</span>
        {children}
        <button data-confirm-ok onClick={onConfirm} />
      </div>
    ) : null,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceAppCatalogPage } from './DeviceAppCatalogPage'
import { DeviceContext } from '../services/Context'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const available = (more: any = {}) => ({
  id: 'remoteit.files',
  name: 'Files',
  publisher: 'remote.it',
  publisherVerifiedDomain: null,
  description: 'Browse a folder',
  root: false,
  version: '1.0.0',
  refused: null,
  needsNewer: false,
  ...more,
})

const turn = vi.fn()
let root: Root
let container: HTMLElement
async function render(permissions = ['VIEW', 'CONNECT', 'MANAGE', 'SCRIPTING']) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  const device = { id: 'D1', name: 'pi-kitchen', accountId: 'A1', permissions } as unknown as IDevice
  await act(async () =>
    root.render(
      <DeviceContext.Provider value={{ device } as any}>
        <DeviceAppCatalogPage />
      </DeviceContext.Provider>
    )
  )
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => {
  push.mockReset()
  turn.mockReset().mockResolvedValue(true)
  catalog.mockReset().mockResolvedValue([])
  apps.value = { apps: [], available: [available()], switching: undefined, turn }
})

const click = (el: Element | null) => act(async () => (el as HTMLElement).click())
const offer = (page: HTMLElement, id: string) => page.querySelector(`[data-catalog-app="${id}"]`) as HTMLElement

describe('the catalogue for this device', () => {
  it('its offers from Device.availableApps; Add adds a restricted one at once, then opens it on this device', async () => {
    const page = await render()
    expect(page.querySelector('[data-title]')?.textContent).toBe('Add an app to pi-kitchen')
    const files = offer(page, 'remoteit.files')
    expect(files.querySelector('[data-catalog-publisher]')?.textContent).toBe('remote.it')
    expect(files.querySelector('[data-catalog-runs]')?.textContent).toBe('Restricted')
    expect(files.querySelector('[data-catalog-description]')?.textContent).toBe('Browse a folder')
    await click(files.querySelector('[data-available-add]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.files', enabled: false }), true)
    expect(push).toHaveBeenCalledWith('/devices/D1/apps/remoteit.files')
  })

  it('a row opens the app in the catalogue', async () => {
    const page = await render()
    await click(offer(page, 'remoteit.files').querySelector('.MuiListItemButton-root'))
    expect(push).toHaveBeenCalledWith('/apps/remoteit.files')
  })

  it('a root app asks first, in words; refused, no release, or a remote.it too old: said', async () => {
    apps.value.available = [
      available({ id: 'acme.agent', name: 'Agent', publisher: 'Acme', root: true }),
      available({ id: 'acme.off', name: 'Off', refused: 'Not allowed on this device by its administrator: no apps (apps_control off)' }),
      available({ id: 'acme.none', name: 'None', version: null }),
      available({ id: 'acme.new', name: 'New', needsNewer: true }),
    ]
    const page = await render()
    expect(offer(page, 'acme.agent').querySelector('[data-catalog-runs]')?.textContent).toBe('Runs as root: full control of the device')
    expect(offer(page, 'acme.off').querySelector('[data-available-why]')?.textContent).toMatch(/apps_control off/)
    expect((offer(page, 'acme.off').querySelector('[data-available-add]') as HTMLButtonElement).disabled).toBe(true)
    expect(offer(page, 'acme.none').querySelector('[data-available-why]')?.textContent).toBe('No release of it here yet')
    expect(offer(page, 'acme.new').querySelector('[data-available-newer]')).not.toBeNull()
    expect((offer(page, 'acme.new').querySelector('[data-available-add]') as HTMLButtonElement).disabled).toBe(false)
    await click(offer(page, 'acme.agent').querySelector('[data-available-add]'))
    expect(turn).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Run Agent as root?')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.agent' }), true, true)
  })

  it('its administrator’s control said up front: local or off, Add held; cloud takes an add', async () => {
    apps.value.available = [
      available({ id: 'acme.kept', name: 'Kept', adminControl: 'local', refused: 'Kept local on the device by its administrator' }),
      available({ id: 'acme.held', name: 'Held', adminControl: 'off', refused: 'Turned off on this device by its administrator (acme.held_control off)' }),
      available({ id: 'acme.cloud', name: 'Cloud', adminControl: 'cloud' }),
    ]
    const page = await render()
    const why = (id: string) => offer(page, id).querySelector('[data-available-why]')?.textContent
    const add = (id: string) => offer(page, id).querySelector('[data-available-add]') as HTMLButtonElement
    expect(why('acme.kept')).toBe('Kept local by this device’s administrator: changed on the device only')
    expect(add('acme.kept').disabled).toBe(true)
    expect(why('acme.held')).toBe('Turned off on this device by its administrator')
    expect(add('acme.held').disabled).toBe(true)
    expect(why('acme.cloud')).toBeUndefined()
    expect(add('acme.cloud').disabled).toBe(false)
  })

  it('a refusal said in graphql’s words, staying on the page', async () => {
    turn.mockResolvedValue({ reason: 'No build for this device’s platform' })
    const page = await render()
    await click(offer(page, 'remoteit.files').querySelector('[data-available-add]'))
    expect(push).not.toHaveBeenCalled()
    expect(page.querySelector('[data-notice]')?.textContent).toBe('No build for this device’s platform')
  })

  it('needs Scripting to add; nothing to add, said', async () => {
    let page = await render(['VIEW', 'CONNECT', 'MANAGE'])
    expect((page.querySelector('[data-available-add]') as HTMLButtonElement).disabled).toBe(true)
    expect(page.querySelector('[data-add-app-scripting]')).not.toBeNull()
    act(() => root.unmount())
    apps.value.available = []
    page = await render()
    expect(page.querySelector('[data-catalog-empty]')?.textContent).toBe('There is no app this device does not have already.')
  })

  it('what each asks of remote.it, from its catalogue entry, beside Runs as root — and named in the consent', async () => {
    catalog.mockResolvedValue([
      { id: 'acme.shell', capabilities: ['person-accounts', 'person-certificates'], protocol: 'ssh' },
      { id: 'remoteit.files', capabilities: [], protocol: 'https' },
    ])
    apps.value.available = [available(), available({ id: 'acme.shell', name: 'Shell', publisher: 'Acme', root: true })]
    const page = await render()
    expect(catalog).toHaveBeenCalledWith('A1')
    expect(offer(page, 'acme.shell').querySelector('[data-catalog-capabilities]')?.textContent).toBe(
      'Keeps accounts for the people you share with · Signs in people by remote.it certificate'
    )
    expect(offer(page, 'remoteit.files').querySelector('[data-catalog-capabilities]')).toBeNull()
    await click(offer(page, 'acme.shell').querySelector('[data-available-add]'))
    expect([...page.querySelectorAll('[data-confirm] [data-app-capability]')].map(c => c.textContent)).toEqual([
      '· Keeps accounts for the people you share with',
      '· Signs in people by remote.it certificate',
    ])
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'acme.shell', capabilities: ['person-accounts', 'person-certificates'] }),
      true,
      true
    )
  })

  it('where the API has no catalogue, nothing said of what they ask', async () => {
    catalog.mockResolvedValue('UNSERVED')
    const page = await render()
    expect(offer(page, 'remoteit.files')).not.toBeNull()
    expect(page.querySelector('[data-catalog-capabilities]')).toBeNull()
  })
})
