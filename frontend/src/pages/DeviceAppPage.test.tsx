import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { apps, catalog, push, params } = vi.hoisted(() => ({
  apps: { value: {} as any },
  catalog: vi.fn(),
  push: vi.fn(),
  params: { appID: 'acme.backup' },
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }), useParams: () => params }))
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../services/graphQLAppCatalog', () => ({ graphQLCatalogApp: catalog }))
vi.mock('../hooks/useDeviceApps', () => ({ useDeviceApps: () => apps.value }))
vi.mock('../hooks/useLocalSubnetName', () => ({ useSubnetName: () => 'pi.on.remote.it' }))
vi.mock('../helpers/terminalHelper', () => ({ openTerminal: vi.fn() }))
vi.mock('../services/graphQLDeviceApps', async () => ({
  ...(await import('../services/deviceAppsShared')),
  CONSOLE: 'remoteit.console',
  SCREENVIEW: 'remoteit.screenview',
  graphQLSshHostKey: vi.fn(async () => 'SHA256:abc'),
}))
vi.mock('../components/DeviceAppSetting', () => ({
  DeviceAppSetting: ({ setting, label, disabled, onChange }: any) => (
    <button data-setting={setting.name} disabled={disabled} onClick={() => onChange(!setting.value)}>
      {label}
    </button>
  ),
}))
vi.mock('../components/Container', () => ({ Container: ({ header, children }: any) => <div>{header}{children}</div> }))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span data-title>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Link', () => ({ Link: ({ to, children, ...rest }: any) => <a data-to={to} {...rest}>{children}</a> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, action, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm>
        <span data-confirm-title>{title}</span>
        {children}
        <button data-confirm-ok onClick={onConfirm}>
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

import { DeviceAppPage } from './DeviceAppPage'
import { DeviceContext } from '../services/Context'
import type { DeviceApp } from '../services/graphQLDeviceApps'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const backup = (more: Partial<DeviceApp> = {}): DeviceApp => ({
  id: 'acme.backup',
  name: 'Backup',
  publisher: 'Acme',
  publisherVerifiedDomain: 'acme.com',
  root: false,
  enabled: true,
  channel: null,
  pinned: null,
  version: '1.4.0',
  release: '1.4.0',
  latest: '1.4.0',
  upToDate: true,
  heldBack: null,
  grantUntil: '2026-12-14T18:00:00.000Z',
  state: 'running',
  detail: null,
  serviceId: 'S7',
  settings: [
    {
      name: 'mode',
      type: 'choice',
      label: 'Back up',
      help: null,
      default: 'nightly',
      value: 'nightly',
      at: null,
      by: null,
      onDevice: false,
      control: 'cloud+local',
      locked: null,
      choices: null,
      deprecated: null,
    },
  ],
  ...more,
})

const CATALOG = {
  id: 'acme.backup',
  accountChannel: 'stable',
  releases: [
    { version: '1.5.0', root: true, withdrawn: null },
    { version: '1.4.0', root: false, withdrawn: null },
    { version: '1.3.2', root: false, withdrawn: '2026-10-25' },
  ],
}

const device = (permissions = ['VIEW', 'CONNECT', 'MANAGE', 'SCRIPTING']) =>
  ({
    id: 'D1',
    name: 'pi-kitchen',
    accountId: 'A1',
    permissions,
    services: [{ id: 'S7', name: 'Backup', port: 30001 }],
  } as unknown as IDevice)

const turn = vi.fn()
const setRelease = vi.fn()
const remove = vi.fn()
const setSetting = vi.fn()

let root: Root
let container: HTMLElement
async function render(permissions?: string[]) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <DeviceContext.Provider value={{ device: device(permissions) } as any}>
        <DeviceAppPage />
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
  params.appID = 'acme.backup'
  push.mockReset()
  catalog.mockReset().mockResolvedValue(CATALOG)
  turn.mockReset().mockResolvedValue(true)
  setRelease.mockReset().mockResolvedValue(true)
  remove.mockReset().mockResolvedValue(true)
  setSetting.mockReset().mockResolvedValue(true)
  apps.value = { apps: [backup()], switching: undefined, turn, setRelease, remove, setSetting }
})

const click = (el: Element | null) => act(async () => (el as HTMLElement).click())
const row = (page: HTMLElement, name: string) => page.querySelector(`[data-app-row-${name}]`) as HTMLElement
const text = (page: HTMLElement, name: string) => row(page, name)?.textContent
const select = (el: Element | null, value: string) =>
  act(async () => {
    const node = el as HTMLSelectElement
    node.value = value
    node.dispatchEvent(new Event('change', { bubbles: true }))
  })
const enabledSwitch = (page: HTMLElement) => page.querySelector('[data-app-enabled] input') as HTMLInputElement

describe('the app on this device', () => {
  it('its name, publisher with Verified, how it runs, and the way back to its device', async () => {
    const page = await render()
    expect(page.querySelector('[data-title]')?.textContent).toBe('Backup')
    expect(page.querySelector('[data-app-publisher]')?.textContent).toBe('By Acme · Verified: acme.com')
    expect(page.querySelector('[data-app-runs]')?.textContent).toBe('Runs restricted: an account of its own on this device')
    expect(page.querySelector('[data-app-back]')?.getAttribute('data-to')).toBe('/devices/D1/edit')
    expect(catalog).toHaveBeenCalledWith('acme.backup', { accountId: 'A1', releases: 50 })
  })

  it('its state: running, starting, disabled, unavailable with its detail, removing — with no controls then', async () => {
    let page = await render()
    expect(text(page, 'state')).toBe('StateRunningEnabled')
    expect(enabledSwitch(page).checked).toBe(true)
    for (const [more, words] of [
      [{ state: 'starting' }, 'Starting — waiting for the device to say so'],
      [{ enabled: false, state: 'disabled', grantUntil: null }, 'Disabled'],
      [{ state: 'unavailable', detail: 'No build for linux-mips' }, 'Not available here: No build for linux-mips'],
    ] as const) {
      act(() => root.unmount())
      apps.value.apps = [backup(more as any)]
      page = await render()
      expect(text(page, 'state')).toContain(words)
    }
    act(() => root.unmount())
    apps.value.apps = [backup({ enabled: false, state: 'removing' })]
    page = await render()
    expect(text(page, 'state')).toBe('StateRemoving…')
    expect(enabledSwitch(page)).toBeNull()
    expect(row(page, 'channel')).toBeNull()
    expect(row(page, 'settings')).toBeNull()
    expect(page.querySelector('[data-app-remove]')).toBeNull()
  })

  it('its version against the one offered on its channel: up to date', async () => {
    const page = await render()
    expect(page.querySelector('[data-app-version-line]')?.textContent).toBe('1.4.0 running · 1.4.0 offered on Stable · up to date')
  })

  it('a disabled app says the version it keeps, and no grant', async () => {
    apps.value.apps = [backup({ enabled: false, state: 'disabled', grantUntil: null, upToDate: false })]
    const page = await render()
    expect(page.querySelector('[data-app-version-line]')?.textContent).toBe('1.4.0 on the device, disabled')
    expect(text(page, 'delivery')).toBe('DeliveryNone while disabled')
  })
})

describe('held back, with why and what releases it', () => {
  it('pinned: Unpin, which unpins (version "")', async () => {
    apps.value.apps = [backup({ pinned: '1.4.0', latest: '1.5.0', upToDate: false, heldBack: { reason: 'pinned', detail: 'Pinned to 1.4.0' } })]
    const page = await render()
    expect(page.querySelector('[data-app-held-back="pinned"]')?.textContent).toBe('Held back: Pinned to 1.4.0')
    await click(page.querySelector('[data-app-unpin]'))
    expect(setRelease).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '' })
  })

  it('a new version needing root: Update now…, which asks first and moves it with consentRoot alone', async () => {
    apps.value.apps = [backup({ awaitingRoot: '1.5.0', upToDate: false, heldBack: { reason: 'consent', detail: '' } })]
    const page = await render()
    expect(page.querySelector('[data-app-held-back="consent"]')?.textContent).toBe('Held back: A new version needs to run as root')
    await click(page.querySelector('[data-app-update-now]'))
    expect(setRelease).not.toHaveBeenCalled()
    expect(page.querySelector('[data-root-consent-update]')?.textContent).toContain('Backup 1.5.0 needs to run as root')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setRelease).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), { consentRoot: true })
  })

  it('held back for consent with no awaitingRoot said: Update now still moves it by setDeviceAppRelease', async () => {
    apps.value.apps = [backup({ latest: '1.5.0', upToDate: false, heldBack: { reason: 'consent', detail: '' } })]
    const page = await render()
    await click(page.querySelector('[data-app-update-now]'))
    expect(page.querySelector('[data-root-consent-update]')?.textContent).toContain('Backup 1.5.0 needs to run as root')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setRelease).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), { consentRoot: true })
    expect(turn).not.toHaveBeenCalled()
  })

  it('the rest say why, with nothing to press: a daemon too old, no build, the device’s own words', async () => {
    for (const [heldBack, words] of [
      [{ reason: 'daemon', detail: 'x' }, 'Held back: Needs a newer remote.it on this device'],
      [{ reason: 'platform', detail: 'No build for linux-mips' }, 'Held back: No build for linux-mips'],
      [{ reason: 'untrusted', detail: '' }, 'Held back: The device refused its publisher’s signature'],
      [{ reason: 'pending', detail: '' }, 'Held back: Given, and the device has not said it runs it yet'],
    ] as const) {
      apps.value.apps = [backup({ upToDate: false, heldBack })]
      const page = await render()
      expect(page.querySelector('[data-app-held-back]')?.textContent).toBe(words)
      expect(page.querySelector('[data-app-update-now]')).toBeNull()
      expect(page.querySelector('[data-app-unpin]')).toBeNull()
      act(() => root.unmount())
      container.remove()
    }
    await render()
  })
})

describe('channel and pin', () => {
  it('the channel: the account’s (named), stable or beta, by setDeviceAppRelease', async () => {
    const page = await render()
    const channel = page.querySelector('[data-app-channel]') as HTMLSelectElement
    expect([...channel.options].map(o => o.textContent)).toEqual(['Account’s (Stable)', 'Stable', 'Beta'])
    await select(channel, 'beta')
    expect(setRelease).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), { channel: 'beta' })
  })

  it('the pin: none or a release standing — a root one asks for the yes first', async () => {
    const page = await render()
    const pin = page.querySelector('[data-app-pin]') as HTMLSelectElement
    expect([...pin.options].map(o => o.value)).toEqual(['', '1.5.0', '1.4.0'])
    await select(pin, '1.4.0')
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '1.4.0' })
    await select(pin, '1.5.0')
    expect(setRelease).toHaveBeenCalledTimes(1)
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Run Backup as root?')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '1.5.0', consentRoot: true })
  })

  it('where the API has no catalogue: only the pin it has', async () => {
    catalog.mockResolvedValue('UNSERVED')
    apps.value.apps = [backup({ pinned: '1.3.0' })]
    const page = await render()
    expect([...(page.querySelector('[data-app-pin]') as HTMLSelectElement).options].map(o => o.value)).toEqual(['', '1.3.0'])
  })
})

describe('its service, settings, root, delivery and problems', () => {
  it('its service with Open while it runs', async () => {
    const page = await render()
    expect(text(page, 'service')).toContain('Backup · port 30001')
    await click(page.querySelector('[data-app-open]'))
    expect(push).toHaveBeenCalledWith({ pathname: '/devices/D1/S7/connect', state: { autoConnect: true, autoLaunch: true } })
  })

  it('the console’s Open terminal and host key in its place', async () => {
    params.appID = 'remoteit.console'
    apps.value.apps = [backup({ id: 'remoteit.console', name: 'Console', root: true, serviceId: 'S7' })]
    const page = await render()
    expect(text(page, 'service')).toContain('Open terminal')
    expect(page.querySelector('[data-app-open]')).toBeNull()
  })

  it('its settings as the device settings’ rows, set by setDeviceAppSetting; read-only without Manage', async () => {
    let page = await render()
    await click(page.querySelector('[data-setting="mode"]'))
    expect(setSetting).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), 'mode', false)
    act(() => root.unmount())
    page = await render(['VIEW', 'CONNECT'])
    expect((page.querySelector('[data-setting="mode"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('root consent: who, when, to which release, how', async () => {
    apps.value.apps = [
      backup({
        root: true,
        rootConsent: { by: 'U1', email: 'bob@acme.com', at: '2026-11-14T18:02:00.000Z', version: '1.4.0', via: 'person' },
      }),
    ]
    const page = await render()
    expect(page.querySelector('[data-app-consent]')?.textContent).toMatch(/^Consented to run as root by bob@acme.com, .+ · to 1.4.0$/)
  })

  it('the delivery grant’s end; the device’s problems', async () => {
    apps.value.apps = [backup({ problems: [{ name: 'max_size_control', error: 'no-such-setting', detail: 'remoteit.files.max_size_control: no such setting, removed in 1.2.0' }] })]
    const page = await render()
    expect(text(page, 'delivery')).toMatch(/^DeliveryGranted until .+, renewed by itself$/)
    expect(page.querySelector('[data-app-problem="max_size_control"]')?.textContent).toBe(
      'remoteit.files.max_size_control: no such setting, removed in 1.2.0'
    )
  })
})

describe('enable, disable and remove', () => {
  it('the switch and Disable disable at once; Enable on a root app asks first', async () => {
    let page = await render()
    await click(page.querySelector('[data-app-toggle]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), false)
    act(() => root.unmount())
    apps.value.apps = [backup({ root: true, enabled: false, state: 'disabled' })]
    page = await render()
    expect(page.querySelector('[data-app-toggle]')?.textContent).toBe('Enable')
    await click(enabledSwitch(page))
    expect(turn).toHaveBeenCalledTimes(1)
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), true, true)
  })

  it('Remove… asks, saying its data on the device is deleted; yes removes it and goes back to the device', async () => {
    const page = await render()
    await click(page.querySelector('[data-app-remove]'))
    expect(remove).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Remove Backup from pi-kitchen?')
    expect(page.querySelector('[data-app-remove-words]')?.textContent).toBe(
      'Its files and its data on the device are deleted. This cannot be undone.'
    )
    await click(page.querySelector('[data-confirm-ok]'))
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }))
    expect(push).toHaveBeenCalledWith('/devices/D1/edit')
  })

  it('a refusal stays on the page, in graphql’s words', async () => {
    remove.mockResolvedValue({ reason: 'Kept local on the device by its administrator' })
    const page = await render()
    await click(page.querySelector('[data-app-remove]'))
    await click(page.querySelector('[data-confirm-ok]'))
    expect(push).not.toHaveBeenCalled()
    expect(page.querySelector('[data-notice]')?.textContent).toBe('Kept local on the device by its administrator')
  })

  it('held by its product: greyed, "Managed by its product <name>"', async () => {
    apps.value.apps = [backup({ locked: { product: 'Kiosks', level: 'enforced' } })]
    const page = await render()
    expect(page.querySelector('[data-app-managed]')?.textContent).toBe('Managed by its product Kiosks')
    for (const control of ['[data-app-enabled] input', '[data-app-toggle]', '[data-app-remove]', '[data-app-channel]', '[data-app-pin]'])
      expect((page.querySelector(control) as HTMLInputElement).disabled).toBe(true)
  })

  it('without Scripting: no enable, channel or pin — Disable and Remove stay; without Manage, nothing', async () => {
    apps.value.apps = [backup({ enabled: false, state: 'disabled' })]
    let page = await render(['VIEW', 'CONNECT', 'MANAGE'])
    expect(enabledSwitch(page).disabled).toBe(true)
    expect((page.querySelector('[data-app-channel]') as HTMLSelectElement).disabled).toBe(true)
    expect((page.querySelector('[data-app-remove]') as HTMLButtonElement).disabled).toBe(false)
    expect(page.querySelector('[data-app-scripting]')).not.toBeNull()
    act(() => root.unmount())
    page = await render(['VIEW', 'CONNECT'])
    expect(page.querySelector('[data-app-remove]')).toBeNull()
    expect(enabledSwitch(page).disabled).toBe(true)
  })

  it('an app not on this device says so', async () => {
    apps.value.apps = []
    const page = await render()
    expect(page.querySelector('[data-app-missing]')?.textContent).toBe('This app is not on this device.')
  })
})
