import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { catalog, setChannel, setMany, push, state, params } = vi.hoisted(() => ({
  catalog: vi.fn(),
  setChannel: vi.fn(),
  setMany: vi.fn(),
  push: vi.fn(),
  state: { value: { user: { id: 'U1' }, active: 'U1' } },
  params: { appID: 'acme.backup' },
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }), useParams: () => params }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select(state.value) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (s: any) => s.active }))
vi.mock('../services/graphQLAppCatalog', () => ({
  graphQLCatalogApp: catalog,
  graphQLSetAccountAppChannel: setChannel,
  UNSERVED: 'UNSERVED',
}))
vi.mock('../services/graphQLDeviceApps', async () => ({
  ...(await import('../services/deviceAppsShared')),
  graphQLSetDeviceAppsRelease: setMany,
}))
vi.mock('../components/Container', () => ({ Container: ({ header, children }: any) => <div>{header}{children}</div> }))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span data-title>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Link', () => ({ Link: ({ to, children, ...rest }: any) => <a data-to={to} {...rest}>{children}</a> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../components/firstPartyApps', () => ({ firstPartyApp: () => undefined }))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, action, disabled, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm>
        <span data-confirm-title>{title}</span>
        {children}
        <button data-confirm-ok disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
        <button data-confirm-deny onClick={onDeny} />
      </div>
    ) : null,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { AppPage } from './AppPage'
import { mockCatalogApp } from '../services/appCatalogMock'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const backup = (filter: any = {}, more: any = {}) => ({ ...mockCatalogApp('acme.backup', filter)!, ...more })

let root: Root
let container: HTMLElement
async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<AppPage />))
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => {
  params.appID = 'acme.backup'
  push.mockReset()
  catalog.mockReset().mockImplementation(async (_id: string, { releases, ...filter }: any) => {
    const app = backup(filter)
    return { ...app, releases: app.releases.slice(0, releases) }
  })
  setChannel.mockReset().mockResolvedValue({ accountChannel: 'beta' })
  setMany.mockReset().mockResolvedValue([
    { deviceId: '80:00:00:00:01:00:00:02', name: 'nas', outcome: 'changed', error: null },
    { deviceId: '80:00:00:00:01:00:00:03', name: 'kiosk-4', outcome: 'refused', error: 'Managed by its product Kiosks' },
  ])
  state.value = { user: { id: 'U1' }, active: 'U1' }
})

const click = (el: Element | null) => act(async () => (el as HTMLElement).click())
const select = (el: Element | null, value: string) =>
  act(async () => {
    const node = el as HTMLSelectElement
    node.value = value
    node.dispatchEvent(new Event('change', { bubbles: true }))
  })
const check = (page: HTMLElement, name: string) =>
  click(page.querySelector(`[data-fleet-device] input[aria-label="${name}"]`))
const device = (page: HTMLElement, name: string) =>
  [...page.querySelectorAll('[data-fleet-device]')].find(el => el.textContent?.startsWith(name)) as HTMLElement

describe('the app in the catalogue', () => {
  it('its version, publisher, how it runs, description and platforms; Add… and Manage releases for its own publisher', async () => {
    const page = await render()
    expect(catalog).toHaveBeenCalledWith('acme.backup', { accountId: undefined, releases: 20 })
    expect(page.querySelector('[data-title]')?.textContent).toBe('Backup')
    expect(page.querySelector('[data-app-about]')?.textContent).toBe('1.4.0 · Acme · Verified: acme.com · Yours')
    expect(page.querySelector('[data-app-runs]')?.textContent).toBe('Restricted')
    expect(page.querySelector('[data-app-platforms]')?.textContent).toBe('linux-amd64 · linux-arm64 · linux-arm64-musl')
    await click(page.querySelector('[data-app-add]'))
    expect(push).toHaveBeenCalledWith('/apps/acme.backup/add')
    await click(page.querySelector('[data-app-manage]'))
    expect(push).toHaveBeenCalledWith('/account/publisher')
    expect(page.querySelector('[data-app-back]')?.getAttribute('data-to')).toBe('/apps')
  })

  it('remote.it’s app: no Manage releases', async () => {
    params.appID = 'remoteit.console'
    catalog.mockResolvedValue(mockCatalogApp('remoteit.console'))
    const page = await render()
    expect(page.querySelector('[data-app-manage]')).toBeNull()
    expect(page.querySelector('[data-app-runs]')?.textContent).toBe('Runs as root: full control of the device')
  })

  it('channels on this stage, a candidate’s share; the account’s channel set by setAccountAppChannel', async () => {
    const page = await render()
    expect(page.querySelector('[data-app-channel="beta"]')?.textContent).toContain('Candidate 1.5.0-rc.1 to 10% of devices')
    const follows = page.querySelector('[data-account-channel]') as HTMLSelectElement
    expect(follows.value).toBe('stable')
    await select(follows, 'beta')
    expect(setChannel).toHaveBeenCalledWith('acme.backup', 'beta', undefined)
    expect(follows.value).toBe('beta')
  })

  it('releases newest first: where the channels point, withdrawn, notes opened in place', async () => {
    const page = await render()
    const rows = [...page.querySelectorAll('[data-app-release]')]
    expect(rows.map(r => r.getAttribute('data-app-release'))).toEqual(['1.5.0-beta.2', '1.4.0', '1.3.2'])
    expect(rows[0].textContent).toContain('beta')
    expect(rows[0].textContent).toContain('Adds S3-compatible targets.')
    expect(rows[2].textContent).toContain('withdrawn')
    await click(rows[0])
    expect(page.querySelector('[data-app-release-notes="1.5.0-beta.2"]')?.textContent).toContain(
      'A bucket on any S3-compatible service can be the target.'
    )
  })

  it('Show more asks for more releases', async () => {
    catalog.mockImplementation(async (_id: string, { releases }: any) => ({
      ...backup(),
      releases: Array.from({ length: releases }, (_, i) => ({ ...backup().releases[1], version: `1.0.${i}` })),
    }))
    const page = await render()
    await click(page.querySelector('[data-app-more-releases]'))
    expect(catalog).toHaveBeenLastCalledWith('acme.backup', { accountId: undefined, releases: 40 })
  })
})

describe('your devices', () => {
  it('the counts, and each device’s version, channel, state, up to date or held back with why', async () => {
    const page = await render()
    expect(page.querySelector('[data-app-fleet-counts]')?.textContent).toBe('3 enabled · 1 disabled · 1 up to date · 2 held back')
    expect(device(page, 'pi-kitchen').querySelector('[data-fleet-status]')?.textContent).toBe('Up to date')
    expect(device(page, 'nas').textContent).toContain('1.3.2 · Stable · Running')
    expect(device(page, 'nas').querySelector('[data-fleet-status]')?.textContent).toBe(
      'Held back: Needs a newer remote.it on this device'
    )
    expect(device(page, 'kiosk-4').querySelector('[data-fleet-status]')?.textContent).toBe('Pinned to 1.4.0')
    expect(device(page, 'gw-3').textContent).toContain('— · Beta · Disabled')
  })

  it('a row opens the app on that device', async () => {
    const page = await render()
    await click(device(page, 'nas').querySelector('.MuiListItemButton-root'))
    expect(push).toHaveBeenCalledWith('/devices/80:00:00:00:01:00:00:02/apps/acme.backup')
  })

  it('filtered by held back and by version', async () => {
    const page = await render()
    await select(page.querySelector('[data-fleet-filter]'), 'held')
    expect(catalog).toHaveBeenLastCalledWith('acme.backup', { accountId: undefined, releases: 20, heldBack: true })
    expect([...page.querySelectorAll('[data-fleet-device]')].length).toBe(2)
    await select(page.querySelector('[data-fleet-version]'), '1.3.2')
    expect(catalog).toHaveBeenLastCalledWith('acme.backup', { accountId: undefined, releases: 20, heldBack: true, version: '1.3.2' })
  })

  it('Update selected: setDeviceAppsRelease(version: ""), then each device’s result', async () => {
    const page = await render()
    expect((page.querySelector('[data-fleet-update]') as HTMLButtonElement).disabled).toBe(true)
    await check(page, 'nas')
    await check(page, 'kiosk-4')
    await click(page.querySelector('[data-fleet-update]'))
    expect(setMany).toHaveBeenCalledWith('acme.backup', ['80:00:00:00:01:00:00:02', '80:00:00:00:01:00:00:03'], { version: '' })
    const results = page.querySelector('[data-app-results]') as HTMLElement
    expect(results.textContent).toContain('nasChanged')
    expect(results.textContent).toContain('kiosk-4Refused: Managed by its product Kiosks')
  })

  it('a device held for root consent: Update asks first, in words, and passes consentRoot', async () => {
    catalog.mockImplementation(async () => {
      const app = backup()
      app.devices.items[1] = { ...app.devices.items[1], heldBack: { reason: 'consent', detail: '' } }
      return app
    })
    const page = await render()
    await check(page, 'nas')
    await click(page.querySelector('[data-fleet-update]'))
    expect(setMany).not.toHaveBeenCalled()
    expect(page.querySelector('[data-fleet-consent]')?.textContent).toContain('runs as root: it gets full control of each device selected')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setMany).toHaveBeenCalledWith('acme.backup', ['80:00:00:00:01:00:00:02'], { version: '', consentRoot: true })
  })

  it('Pin selected… picks a standing release; a root one only with the yes ticked', async () => {
    catalog.mockImplementation(async () => {
      const app = backup()
      app.releases[0] = { ...app.releases[0], root: true }
      return app
    })
    const page = await render()
    await check(page, 'pi-kitchen')
    await click(page.querySelector('[data-fleet-pin]'))
    const to = page.querySelector('[data-fleet-pin-to]') as HTMLSelectElement
    expect([...to.options].map(o => o.value)).toEqual(['1.5.0-beta.2', '1.4.0'])
    expect((page.querySelector('[data-confirm-ok]') as HTMLButtonElement).disabled).toBe(true)
    await click(page.querySelector('[data-fleet-pin-consent]'))
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setMany).toHaveBeenCalledWith('acme.backup', ['80:00:00:00:01:00:00:01'], { version: '1.5.0-beta.2', consentRoot: true })
    await check(page, 'pi-kitchen')
    await click(page.querySelector('[data-fleet-pin]'))
    await select(page.querySelector('[data-fleet-pin-to]'), '1.4.0')
    expect(page.querySelector('[data-fleet-pin-consent]')).toBeNull()
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setMany).toHaveBeenLastCalledWith('acme.backup', ['80:00:00:00:01:00:00:01'], { version: '1.4.0' })
  })

  it('a call refused whole: its words', async () => {
    setMany.mockResolvedValue({ reason: 'More than 500 devices: add it to a product' })
    const page = await render()
    await check(page, 'nas')
    await click(page.querySelector('[data-fleet-update]'))
    expect(page.querySelector('[data-notice]')?.textContent).toBe('More than 500 devices: add it to a product')
  })
})

describe('an app the account may not use, or no catalogue', () => {
  it('says so', async () => {
    catalog.mockResolvedValue(null)
    let page = await render()
    expect(page.querySelector('[data-app-unavailable]')?.textContent).toBe('This app is not one this account may use.')
    act(() => root.unmount())
    catalog.mockResolvedValue('UNSERVED')
    page = await render()
    expect(page.querySelector('[data-app-unavailable]')?.textContent).toBe('This server does not have the app catalogue yet.')
  })
})
