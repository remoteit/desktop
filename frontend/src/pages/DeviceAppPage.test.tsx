import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { apps, catalog, push, params, openTerminal } = vi.hoisted(() => ({
  apps: { value: {} as any },
  catalog: vi.fn(),
  push: vi.fn(),
  params: { appID: 'acme.backup' },
  openTerminal: vi.fn(),
}))
// The page reads its services' ports with multiPortServices' formatting; nothing here asks the API.
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }), useParams: () => params }))
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../services/graphQLAppCatalog', () => ({ graphQLCatalogApp: catalog }))
vi.mock('../hooks/useDeviceApps', () => ({ useDeviceApps: () => apps.value }))
vi.mock('../hooks/useLocalSubnetName', () => ({ useSubnetName: () => 'pi.on.remote.it' }))
vi.mock('../helpers/terminalHelper', () => ({ openTerminal }))
vi.mock('../services/browser', () => ({ default: { isNative: false }, windowOpen: vi.fn() }))
vi.mock('../services/graphQLDeviceApps', async () => ({
  ...(await import('../services/deviceAppsShared')),
  SCREENVIEW: 'remoteit.screenview',
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
  Confirm: ({ open, title, action, children, disabled, onConfirm, onDeny }: any) =>
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

import { DeviceAppPage } from './DeviceAppPage'
import { DeviceContext } from '../services/Context'
import type { DeviceApp } from '../services/graphQLDeviceApps'
import { withServices } from '../test/deviceApps'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const backup = (more: Partial<DeviceApp> = {}): DeviceApp =>
  withServices({
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
  protocol: 'https',
  capabilities: [],
  hostKey: null,
  sessions: [],
  sessionsOpen: 0,
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
  version: '1.4.0',
  channels: [
    { channel: 'stable', current: '1.4.0', candidate: null, share: 0 },
    { channel: 'beta', current: '1.5.0', candidate: null, share: 0 },
  ],
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
    services: [
      { id: 'S7', name: 'Backup', port: 30001 },
      { id: 'S8', name: 'Stream', port: 8554, ports: ['8554', '5004-5005'] },
    ],
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
  openTerminal.mockReset()
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
  it('what it does first, its publisher with Verified, what it needs, and the way back to its device', async () => {
    let page = await render()
    expect(page.querySelector('[data-title]')?.textContent).toBe('Backup')
    // No description in the catalogue: a line from its name and how it opens, nothing more claimed.
    expect(page.querySelector('[data-app-purpose]')?.textContent).toBe('Backup runs on the device and opens in your browser.')
    expect(page.querySelector('[data-app-publisher]')?.textContent).toBe('By Acme · Verified: acme.com')
    // A restricted app needs nothing more of the device: nothing said.
    expect(page.querySelector('[data-app-runs]')).toBeNull()
    expect(page.querySelector('[data-app-back]')?.getAttribute('data-to')).toBe('/devices/D1/services')
    expect(catalog).toHaveBeenCalledWith('acme.backup', { accountId: 'A1', releases: 100 })
    act(() => root.unmount())
    container.remove()
    catalog.mockResolvedValue({ ...CATALOG, description: 'Nightly backups to your bucket.' })
    apps.value.apps = [backup({ root: true })]
    page = await render()
    expect(page.querySelector('[data-app-purpose]')?.textContent).toBe('Nightly backups to your bucket.')
    expect(page.querySelector('[data-app-runs]')?.textContent).toBe('Needs full control of the device')
  })

  it('the console is named Terminal wherever its name is shown; its id and API name stay', async () => {
    params.appID = 'remoteit.console'
    apps.value.apps = [backup({ id: 'remoteit.console', name: 'Console', protocol: 'ssh' })]
    const page = await render()
    expect(page.querySelector('[data-title]')?.textContent).toBe('Terminal')
    expect(page.querySelector('[data-app-purpose]')?.textContent).toBe('Terminal runs on the device and opens as a terminal.')
    expect(catalog).toHaveBeenCalledWith('remoteit.console', expect.anything())
  })

  it('its state in a word or two beside an On/Off switch, the device’s words under it; removing — with no controls then', async () => {
    let page = await render()
    expect(text(page, 'state')).toBe('RunningOn')
    expect(enabledSwitch(page).checked).toBe(true)
    for (const [more, word, detail] of [
      [{ state: 'starting' }, 'Starting', undefined],
      [{ enabled: false, state: 'disabled', grantUntil: null }, 'Off', undefined],
      [{ state: 'unavailable', detail: 'No build for linux-mips' }, 'Not available', 'No build for linux-mips'],
      [{ state: 'unavailable', detail: 'Needs a newer remote.it on this device' }, 'Needs update', 'Update the agent on this device to run this app.'],
    ] as const) {
      act(() => root.unmount())
      apps.value.apps = [backup(more as any)]
      page = await render()
      expect(page.querySelector('[data-app-state]')?.textContent).toBe(word)
      expect(page.querySelector('[data-app-state-detail]')?.textContent).toBe(detail)
    }
    expect(text(page, 'state')).toContain('On')
    act(() => root.unmount())
    apps.value.apps = [backup({ enabled: false, state: 'removing' })]
    page = await render()
    expect(text(page, 'state')).toBe('Removing…')
    expect(enabledSwitch(page)).toBeNull()
    expect(row(page, 'channel')).toBeNull()
    expect(row(page, 'settings')).toBeNull()
    expect(page.querySelector('[data-app-remove]')).toBeNull()
  })

  it('its version, under Version: up to date, or the newer one its channel offers', async () => {
    let page = await render()
    expect(page.querySelector('[data-app-version-section] [data-app-version-line]')?.textContent).toBe('1.4.0, up to date')
    act(() => root.unmount())
    container.remove()
    apps.value.apps = [backup({ channel: 'beta', release: '1.5.0', upToDate: false })]
    page = await render()
    expect(page.querySelector('[data-app-version-line]')?.textContent).toBe('1.4.0 · 1.5.0 on Beta')
  })

  it('enabled but not run — turned off by its administrator — is on the device, not running', async () => {
    apps.value.apps = [backup({ state: 'unavailable', detail: 'Turned off on this device by its administrator (acme.backup_control off)', adminControl: 'off' } as Partial<DeviceApp>)]
    const page = await render()
    expect(page.querySelector('[data-app-version-line]')?.textContent).toBe('1.4.0 on the device, not running')
  })

  it('a disabled app says the version it keeps, and no grant', async () => {
    apps.value.apps = [backup({ enabled: false, state: 'disabled', grantUntil: null, upToDate: false })]
    const page = await render()
    expect(page.querySelector('[data-app-version-line]')?.textContent).toBe('1.4.0, kept on the device while off')
    expect(text(page, 'delivery')).toBe('DeliveryNone while off')
  })
})

describe('held back, with why and what releases it', () => {
  it('pinned: Unpin, which unpins (version "")', async () => {
    apps.value.apps = [backup({ pinned: '1.4.0', latest: '1.5.0', upToDate: false, heldBack: { reason: 'pinned', detail: 'Pinned to 1.4.0' } })]
    const page = await render()
    expect(page.querySelector('[data-app-held-back="pinned"]')?.textContent).toBe('Not updated: Pinned to 1.4.0')
    await click(page.querySelector('[data-app-unpin]'))
    expect(setRelease).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '' })
  })

  it('a new version needing root: Update now…, which asks first and moves it with consentRoot alone', async () => {
    apps.value.apps = [backup({ awaitingRoot: '1.5.0', upToDate: false, heldBack: { reason: 'consent', detail: '' } })]
    const page = await render()
    expect(page.querySelector('[data-app-held-back="consent"]')?.textContent).toBe('Not updated: A new version needs full control')
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
      [{ reason: 'daemon', detail: 'x' }, 'Not updated: Needs a newer agent on this device'],
      [{ reason: 'platform', detail: 'No build for linux-mips' }, 'Not updated: No build for linux-mips'],
      [{ reason: 'untrusted', detail: '' }, 'Not updated: The device refused its publisher’s signature'],
      [{ reason: 'pending', detail: '' }, 'Not updated: Given, and the device has not said it runs it yet'],
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
  it('withdrawn with none standing: graphql’s words once — in State, not again as why it is held back', async () => {
    const words = 'Its release was withdrawn by its publisher: removed from the device until a new one is published'
    apps.value.apps = [
      backup({ state: 'unavailable', detail: words, upToDate: false, heldBack: { reason: 'unavailable', detail: words } }),
    ]
    const page = await render()
    expect(text(page, 'state')).toContain(words)
    expect(text(page, 'state')).not.toContain('Not available here')
    expect(page.querySelector('[data-app-held-back]')).toBeNull()
  })

  it('the channel: the account’s (named), stable or beta, by setDeviceAppRelease — one whose release asks, after the yes', async () => {
    const page = await render()
    const channel = page.querySelector('[data-app-channel]') as HTMLSelectElement
    expect([...channel.options].map(o => o.textContent)).toEqual(['Account default (Stable)', 'Stable', 'Beta'])
    await select(channel, 'stable')
    expect(setRelease).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), { channel: 'stable' })
    // Beta gives 1.5.0, which runs as root: asked first, as graphql refuses it without.
    await select(channel, 'beta')
    expect(setRelease).toHaveBeenCalledTimes(1)
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Give Backup full control of this device?')
    expect(page.querySelector('[data-confirm-ok]')?.textContent).toBe('Consent and update')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { channel: 'beta', consentRoot: true })
  })

  it('a channel rolling out a candidate: the yes names what its current and its candidate ask together', async () => {
    // Which of them this device is given is its bucket's: a root current, and a restricted candidate asking ssh-exec.
    const releases = [
      { version: '1.6.0', root: false, withdrawn: null, capabilities: ['ssh-exec'] },
      { version: '1.5.0', root: true, withdrawn: null, capabilities: [] },
      { version: '1.4.0', root: false, withdrawn: null, capabilities: [] },
    ]
    const channels = [CATALOG.channels[0], { channel: 'beta', current: '1.5.0', candidate: '1.6.0', share: 10 }]
    catalog.mockResolvedValue({ ...CATALOG, channels, releases })
    const page = await render()
    await select(page.querySelector('[data-app-channel]') as HTMLSelectElement, 'beta')
    expect(setRelease).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Give Backup full control of this device?')
    expect([...page.querySelectorAll('[data-confirm] [data-app-capability]')].map(c => c.getAttribute('data-app-capability'))).toEqual(['ssh-exec'])
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { channel: 'beta', consentRoot: true })
  })

  it('a release that declares capabilities asks as a root one does; a consent that covers it does not ask again', async () => {
    const releases = [
      { version: '1.6.0', root: false, withdrawn: null, capabilities: ['ssh-exec'] },
      { version: '1.5.0', root: false, withdrawn: null, capabilities: ['ssh-exec'] },
      { version: '1.4.0', root: false, withdrawn: null, capabilities: [] },
    ]
    catalog.mockResolvedValue({ ...CATALOG, releases })
    let page = await render()
    await select(page.querySelector('[data-app-pin]') as HTMLSelectElement, '1.5.0')
    expect(setRelease).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Allow Backup what it asks?')
    expect(page.querySelector('[data-root-consent]')?.getAttribute('data-root-consent')).toBe('capabilities')
    expect([...page.querySelectorAll('[data-confirm] [data-app-capability]')].map(c => c.getAttribute('data-app-capability'))).toEqual(['ssh-exec'])
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '1.5.0', consentRoot: true })
    act(() => root.unmount())
    container.remove()
    // Consented to 1.5.0: 1.6.0 asks nothing more, and is pinned at once.
    setRelease.mockClear()
    apps.value.apps = [backup({ rootConsent: { by: 'U1', email: null, at: '2026-11-10T00:00:00Z', version: '1.5.0', via: 'person' } })]
    page = await render()
    await select(page.querySelector('[data-app-pin]') as HTMLSelectElement, '1.6.0')
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '1.6.0' })
    // Disabled, a pin gives it nothing: nothing asked.
    act(() => root.unmount())
    container.remove()
    setRelease.mockClear()
    apps.value.apps = [backup({ enabled: false, state: 'disabled', serviceId: null })]
    page = await render()
    await select(page.querySelector('[data-app-pin]') as HTMLSelectElement, '1.5.0')
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '1.5.0' })
  })

  it('the pin: none or a release standing — a root one asks for the yes first', async () => {
    const page = await render()
    const pin = page.querySelector('[data-app-pin]') as HTMLSelectElement
    expect([...pin.options].map(o => o.value)).toEqual(['', '1.5.0', '1.4.0'])
    await select(pin, '1.4.0')
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '1.4.0' })
    await select(pin, '1.5.0')
    expect(setRelease).toHaveBeenCalledTimes(1)
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Give Backup full control of this device?')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(setRelease).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), { version: '1.5.0', consentRoot: true })
  })

  it('a consent names what the release it is given to asks, not the version running: a pin, and Update now', async () => {
    const releases = [
      { version: '1.5.0', root: true, withdrawn: null, capabilities: ['person-accounts', 'ssh-exec'] },
      { version: '1.4.0', root: false, withdrawn: null, capabilities: [] },
    ]
    catalog.mockResolvedValue({ ...CATALOG, releases })
    let page = await render()
    await select(page.querySelector('[data-app-pin]') as HTMLSelectElement, '1.5.0')
    expect([...page.querySelectorAll('[data-confirm] [data-app-capability]')].map(c => c.getAttribute('data-app-capability'))).toEqual([
      'person-accounts',
      'ssh-exec',
    ])
    act(() => root.unmount())
    container.remove()
    apps.value.apps = [backup({ awaitingRoot: '1.5.0', upToDate: false, heldBack: { reason: 'consent', detail: '' } })]
    page = await render()
    await click(page.querySelector('[data-app-update-now]'))
    expect([...page.querySelectorAll('[data-confirm] [data-app-capability]')].map(c => c.getAttribute('data-app-capability'))).toEqual([
      'person-accounts',
      'ssh-exec',
    ])
    expect(catalog).toHaveBeenCalledWith('acme.backup', expect.objectContaining({ accountId: 'A1' }))
  })

  it('the yes waits while what the release asks is read; where the catalogue cannot say, it is not taken', async () => {
    let answer: (value: unknown) => void = () => {}
    catalog.mockResolvedValueOnce(CATALOG).mockReturnValueOnce(new Promise(resolve => (answer = resolve)))
    apps.value.apps = [backup({ capabilities: ['person-certificates'] })]
    const page = await render()
    await select(page.querySelector('[data-app-pin]') as HTMLSelectElement, '1.5.0')
    expect((page.querySelector('[data-confirm-ok]') as HTMLButtonElement).disabled).toBe(true)
    await act(async () => answer('ERROR'))
    // Not the running release's words for another's: said not known, asked as root, and the yes held.
    expect((page.querySelector('[data-confirm-ok]') as HTMLButtonElement).disabled).toBe(true)
    expect(page.querySelector('[data-root-consent-unknown]')?.textContent).toBe(
      'What this version asks could not be read, so it cannot be consented to here. Try again later.'
    )
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Give Backup full control of this device?')
    expect(page.querySelector('[data-confirm] [data-app-capability]')).toBeNull()
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

  it('disabled: no Open — its service stopped, said where its release names a protocol', async () => {
    // graphql 12c: a disabled app has no release, grant, heldBack or service.
    const disabled = { enabled: false, state: 'disabled' as const, release: null, grantUntil: null, heldBack: null, serviceId: null }
    apps.value.apps = [backup(disabled)]
    catalog.mockResolvedValue({ ...CATALOG, protocol: 'https' })
    let page = await render()
    expect(page.querySelector('[data-app-open]')).toBeNull()
    expect(text(page, 'service')).toContain('Stopped while the app is off. Turn it on to open it.')
    act(() => root.unmount())
    container.remove()
    catalog.mockResolvedValue({ ...CATALOG, protocol: null })
    page = await render()
    expect(row(page, 'service')).toBeNull()
    act(() => root.unmount())
    container.remove()
    // Even one whose service graphql still names, disabled, offers no Open, nor Open terminal.
    const terminal = { protocol: 'ssh', capabilities: ['person-certificates'] }
    apps.value.apps = [
      backup({ ...disabled, serviceId: 'S7' }),
      backup({ id: 'acme.shell', ...disabled, ...terminal, serviceId: 'S7' }),
    ]
    page = await render()
    expect(page.querySelector('[data-app-open]')).toBeNull()
    act(() => root.unmount())
    container.remove()
    params.appID = 'acme.shell'
    page = await render()
    expect(page.querySelector('[data-app-terminal]')).toBeNull()
  })

  it('Open in the words of its protocol: a page, a screen, else Open', async () => {
    const words = async (protocol: string | null) => {
      apps.value.apps = [backup({ protocol })]
      const answer = (await render()).querySelector('[data-app-open]')?.textContent
      act(() => root.unmount())
      container.remove()
      return answer
    }
    expect(await words('https')).toBe('Open page')
    expect(await words('http')).toBe('Open page')
    expect(await words('vnc')).toBe('Open screen')
    expect(await words('rdp')).toBe('Open screen')
    expect(await words('tcp')).toBe('Open')
    expect(await words('udp')).toBe('Connect')
  })

  it('udp: a connection alone — its port, said UDP, for the person’s own UDP client; never a terminal or a page', async () => {
    params.appID = 'acme.dns'
    // Even one that declares person-certificates: only ssh opens a terminal.
    apps.value.apps = [backup({ id: 'acme.dns', name: 'DNS', protocol: 'udp', capabilities: ['person-certificates'] })]
    const page = await render()
    expect(text(page, 'service')).toContain('Backup · UDP port 30001')
    expect(page.querySelector('[data-app-terminal]')).toBeNull()
    expect(page.querySelector('[data-app-open]')?.textContent).toBe('Connect')
    await click(page.querySelector('[data-app-open]'))
    expect(push).toHaveBeenCalledWith({ pathname: '/devices/D1/S7/connect', state: { autoConnect: true } })
  })

  it('a port its owner chooses is its service’s, edited under Service, not again under Settings', async () => {
    const port = {
      ...backup().settings[0],
      name: 'port',
      type: 'int',
      label: 'Port',
      default: 8443,
      value: 8443,
      choices: null,
    }
    apps.value.apps = [backup({ portSetting: 'port', settings: [...backup().settings, port] })]
    let page = await render()
    expect(row(page, 'service')?.querySelector('[data-app-port-setting="port"]')).not.toBeNull()
    expect(row(page, 'service')?.textContent).toContain('Port people connect to')
    expect(row(page, 'settings')?.querySelector('[data-app-port-setting]')).toBeNull()
    expect(row(page, 'settings')?.textContent).not.toContain('Port')
    act(() => root.unmount())
    container.remove()
    // Disabled, its service stopped: the setting is under Settings, where it can still be changed.
    apps.value.apps = [
      backup({ enabled: false, state: 'disabled', serviceId: null, portSetting: 'port', settings: [...backup().settings, port] }),
    ]
    page = await render()
    expect(page.querySelector('[data-app-port-setting]')).toBeNull()
    expect(row(page, 'settings')?.textContent).toContain('Port')
  })

  it('each of its services, the primary first: its ports — several as a list, the first the launch port — its listeners’ port settings, and its own Open', async () => {
    params.appID = 'acme.camera'
    const setting = (name: string, label: string) => ({ ...backup().settings[0], name, type: 'int', label, default: 8080, value: 8080, choices: null })
    const camera = backup({
      id: 'acme.camera',
      name: 'Camera',
      protocol: 'http',
      serviceId: 'S7',
      portSetting: 'web_port',
      settings: [...backup().settings, setting('web_port', 'Web port'), setting('rtsp_port', 'RTSP port')],
      services: [
        { key: null, name: 'Camera', protocol: 'http', multiPort: false, port: null, portSetting: 'web_port',
          listeners: [{ name: 'web', type: 'tcp', port: null, portSetting: null, ports: null }], serviceId: 'S7' },
        { key: 'rtsp', name: 'Stream', protocol: 'udp', multiPort: true, port: null, portSetting: null,
          listeners: [
            { name: 'rtsp', type: 'udp', port: null, portSetting: 'rtsp_port', ports: null },
            { name: 'rtp', type: 'udp', port: null, portSetting: null, ports: '5004-5005' },
          ], serviceId: 'S8' },
      ],
    })
    apps.value.apps = [camera]
    const page = await render()
    const services = page.querySelectorAll('[data-app-service]')
    expect(services.length).toBe(2)
    expect(services[0].textContent).toContain('Backup · port 30001')
    expect(services[0].querySelector('[data-app-port-setting="web_port"]')?.textContent).toBe('Port people connect to')
    expect(services[1].textContent).toContain('Stream · ports 8554, 5004-5005')
    expect(services[1].querySelector('[data-app-service-ports]')?.textContent).toBe(
      'This connection reaches port 8554 only. Reach all its ports, 8554, 5004-5005, at the device’s address.'
    )
    expect(services[1].querySelector('[data-app-port-setting="rtsp_port"]')?.textContent).toBe('Port of rtsp')
    // Each port setting edited once: under its service, not again under Settings.
    expect(row(page, 'settings')?.querySelector('[data-setting="web_port"], [data-setting="rtsp_port"]')).toBeNull()
    expect(row(page, 'settings')?.textContent).toContain('Back up')
    // Each its own Open: the udp one connects, launching nothing.
    const opens = page.querySelectorAll('[data-app-open]')
    expect([...opens].map(open => open.textContent)).toEqual(['Open page', 'Connect'])
    await click(opens[1])
    expect(push).toHaveBeenCalledWith({ pathname: '/devices/D1/S8/connect', state: { autoConnect: true } })
    act(() => root.unmount())
    container.remove()
    // Disabled, its services stopped: its port settings are under Settings, by their own labels.
    apps.value.apps = [{ ...camera, enabled: false, state: 'disabled', serviceId: null, services: camera.services.map(s => ({ ...s, serviceId: null })) }]
    const stopped = await render()
    expect(stopped.querySelectorAll('[data-app-service]').length).toBe(0)
    expect(row(stopped, 'settings')?.textContent).toContain('Web port')
    expect(row(stopped, 'settings')?.textContent).toContain('RTSP port')
  })

  it('Open terminal in Open’s place, for any app whose service is ssh and that declares person-certificates', async () => {
    params.appID = 'acme.shell'
    const shell = { id: 'acme.shell', name: 'Shell', protocol: 'ssh', capabilities: ['person-certificates'] }
    apps.value.apps = [backup(shell)]
    let page = await render()
    expect(page.querySelector('[data-app-open]')).toBeNull()
    await click(page.querySelector('[data-app-terminal]'))
    expect(openTerminal).toHaveBeenCalledWith({ name: 'pi.on.remote.it', port: 30001, title: 'Shell', service: 'S7' })
    act(() => root.unmount())
    container.remove()
    // ssh that does not sign people in by certificate: opened as any service is.
    apps.value.apps = [backup({ ...shell, capabilities: ['ssh-exec'] })]
    page = await render()
    expect(page.querySelector('[data-app-terminal]')).toBeNull()
    expect(page.querySelector('[data-app-open]')).not.toBeNull()
  })

  it('the key its service presents, where the device reports one — whatever the app', async () => {
    expect((await render()).querySelector('[data-host-key]')).toBeNull()
    act(() => root.unmount())
    container.remove()
    apps.value.apps = [backup({ hostKey: 'sha256:0f1e' })]
    expect((await render()).querySelector('[data-host-key]')?.textContent).toBe('sha256:0f1e')
  })

  it('what it asks of remote.it beyond running, beside how it runs; nothing for an ordinary app', async () => {
    expect((await render()).querySelector('[data-app-asks]')).toBeNull()
    act(() => root.unmount())
    container.remove()
    apps.value.apps = [backup({ root: true, capabilities: ['person-accounts', 'person-certificates', 'ssh-exec'] })]
    expect((await render()).querySelector('[data-app-asks]')?.textContent).toBe(
      'Keeps accounts for the people you share with · Signs people in with their Remote.It certificate · Lets AI run commands you allow'
    )
  })

  it('its sessions: how many are open; each session, as whom, by an AI and since when, for those who manage it', async () => {
    expect(row(await render(), 'sessions')).toBeNull()
    act(() => root.unmount())
    container.remove()
    const sessions = [
      { session: '9f2c1e0a77b3', login: 'r3-evan', via: null, since: null },
      { session: 'a1b2', login: null, via: 'ai', since: null },
    ]
    apps.value.apps = [backup({ sessions, sessionsOpen: 3 })]
    let page = await render()
    expect(page.querySelector('[data-app-sessions-open]')?.textContent).toBe('3 open now')
    // The session, never a person: an app knows sessions, not who is behind them.
    expect(page.querySelector('[data-app-session="9f2c1e0a77b3"]')?.textContent).toBe('Session 9f2c1e0a · as r3-evan')
    expect(page.querySelector('[data-app-session="a1b2"]')?.textContent).toBe('Session a1b2 · by an AI')
    expect(page.querySelector('[data-app-sessions-more]')?.textContent).toBe('1 more not listed')
    act(() => root.unmount())
    container.remove()
    page = await render(['VIEW', 'CONNECT'])
    expect(page.querySelector('[data-app-sessions-open]')?.textContent).toBe('3 open now')
    expect(page.querySelector('[data-app-session]')).toBeNull()
  })

  it('its settings as the device settings’ rows, in its release’s words, set by setDeviceAppSetting; read-only without Manage', async () => {
    let page = await render()
    expect(page.querySelector('[data-setting="mode"]')?.textContent).toBe('Back up')
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
    expect(page.querySelector('[data-app-consent]')?.textContent).toMatch(/^Given full control by bob@acme.com, .+ · to 1.4.0$/)
  })

  it('the delivery grant’s end; the device’s problems', async () => {
    apps.value.apps = [backup({ problems: [{ name: 'max_size_control', error: 'no-such-setting', detail: 'remoteit.files.max_size_control: no such setting, removed in 1.2.0' }] })]
    const page = await render()
    expect(text(page, 'delivery')).toMatch(/^DeliveryAllowed until .+, renewed automatically$/)
    expect(page.querySelector('[data-app-problem="max_size_control"]')?.textContent).toBe(
      'remoteit.files.max_size_control: no such setting, removed in 1.2.0'
    )
  })
})

describe('sections: settings in plain words, Version and Advanced', () => {
  const setting = (name: string, type: string, label: string, value: any) => ({
    ...backup().settings[0],
    name,
    type,
    label,
    default: value,
    value,
    choices: null,
  })

  it('“AI can run commands on this device” first, for an app that lets AI run commands; set by setDeviceAppSetting', async () => {
    apps.value.apps = [
      backup({
        capabilities: ['ssh-exec'],
        settings: [setting('mode', 'choice', 'Back up', 'nightly'), setting('ai_commands', 'bool', 'Allow AI commands', true)],
      }),
    ]
    const page = await render()
    const shown = [...row(page, 'settings').querySelectorAll('[data-setting]')].map(el => el.textContent)
    expect(shown).toEqual(['AI can run commands on this device', 'Back up'])
    await click(page.querySelector('[data-setting="ai_commands"]'))
    expect(setSetting).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), 'ai_commands', false)
  })

  it('an app without that capability keeps its release’s words', async () => {
    apps.value.apps = [backup({ settings: [setting('ai_commands', 'bool', 'Allow AI commands', true)] })]
    const page = await render()
    expect(page.querySelector('[data-setting="ai_commands"]')?.textContent).toBe('Allow AI commands')
  })

  it('numeric limits sit under Advanced, not Settings', async () => {
    apps.value.apps = [
      backup({ settings: [setting('mode', 'choice', 'Back up', 'nightly'), setting('max_detached', 'int', 'Detached commands at once', 8)] }),
    ]
    const page = await render()
    expect(row(page, 'settings').querySelector('[data-setting="max_detached"]')).toBeNull()
    expect(page.querySelector('[data-app-advanced] [data-setting="max_detached"]')?.textContent).toBe('Detached commands at once')
  })

  it('no Advanced where there is nothing for it', async () => {
    expect((await render()).querySelector('[data-app-advanced]')).toBeNull()
  })

  it('Version holds the version, channel, the version it is kept on and delivery; Advanced the host key', async () => {
    apps.value.apps = [backup({ hostKey: 'sha256:0f1e' })]
    const page = await render()
    const version = page.querySelector('[data-app-version-section]') as HTMLElement
    for (const name of ['version', 'channel', 'pin', 'delivery']) expect(version.querySelector(`[data-app-row-${name}]`)).not.toBeNull()
    expect(page.querySelector('[data-app-advanced] [data-host-key]')).not.toBeNull()
  })
})

describe('enable, disable and remove', () => {
  it('the switch turns it off at once; on, a root app asks first', async () => {
    let page = await render()
    await click(enabledSwitch(page))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), false)
    act(() => root.unmount())
    apps.value.apps = [backup({ root: true, enabled: false, state: 'disabled' })]
    page = await render()
    expect(text(page, 'state')).toBe('OffOff')
    await click(enabledSwitch(page))
    expect(turn).toHaveBeenCalledTimes(1)
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), true, true)
  })

  it('Remove app… asks, saying its data on the device is deleted; yes removes it and goes back to the device', async () => {
    const page = await render()
    await click(page.querySelector('[data-app-remove]'))
    expect(remove).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Remove Backup from pi-kitchen?')
    expect(page.querySelector('[data-app-remove-words]')?.textContent).toBe(
      'This deletes the app’s files and data on the device. You can’t undo this.'
    )
    await click(page.querySelector('[data-confirm-ok]'))
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }))
    expect(push).toHaveBeenCalledWith('/devices/D1/services')
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
    for (const control of ['[data-app-enabled] input', '[data-app-remove]', '[data-app-channel]', '[data-app-pin]'])
      expect((page.querySelector(control) as HTMLInputElement).disabled).toBe(true)
  })

  it('kept local by its administrator: said up front; switch and Remove greyed — the channel and pin stay', async () => {
    apps.value.apps = [backup({ adminControl: 'local' })]
    const page = await render()
    expect(page.querySelector('[data-app-admin="local"]')?.textContent).toBe(
      'Kept local by this device’s administrator: changed on the device only'
    )
    for (const control of ['[data-app-enabled] input', '[data-app-remove]'])
      expect((page.querySelector(control) as HTMLInputElement).disabled).toBe(true)
    for (const control of ['[data-app-channel]', '[data-app-pin]'])
      expect((page.querySelector(control) as HTMLSelectElement).disabled).toBe(false)
  })

  it('turned off by its administrator: said; turning it on greyed — Remove stays; one still on may be turned off', async () => {
    apps.value.apps = [backup({ adminControl: 'off', enabled: false, state: 'disabled', release: null, serviceId: null, grantUntil: null })]
    let page = await render()
    expect(page.querySelector('[data-app-admin="off"]')?.textContent).toBe('Turned off on this device by its administrator')
    expect(enabledSwitch(page).disabled).toBe(true)
    expect((page.querySelector('[data-app-remove]') as HTMLButtonElement).disabled).toBe(false)
    act(() => root.unmount())
    container.remove()
    // Enabled here, turned off there: graphql's detail says it — not said twice — and Disable is taken.
    apps.value.apps = [
      backup({
        adminControl: 'off',
        state: 'unavailable',
        detail: 'Turned off on this device by its administrator (acme.backup_control off)',
      }),
    ]
    page = await render()
    expect(page.querySelector('[data-app-admin]')).toBeNull()
    expect(text(page, 'state')).toContain('Turned off on this device by its administrator (acme.backup_control off)')
    expect(enabledSwitch(page).disabled).toBe(false)
    expect(enabledSwitch(page).checked).toBe(true)
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
