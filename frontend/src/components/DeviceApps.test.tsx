import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { apps, name, openTerminal, push } = vi.hoisted(() => ({
  push: vi.fn(),
  apps: { value: {} as any },
  name: { value: 'pi-evan.on.remote.it' as string | undefined },
  openTerminal: vi.fn(),
}))
// The release a consent names is read from its catalogue entry; none here: the app's own capabilities.
vi.mock('../services/graphQLAppCatalog', () => ({ graphQLCatalogApp: () => Promise.resolve('UNSERVED') }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../hooks/useDeviceApps', () => ({ useDeviceApps: () => apps.value }))
vi.mock('../hooks/useDeviceSettings', () => ({ useDeviceSettings: () => ({ setting: () => undefined }) }))
vi.mock('../hooks/useLocalSubnetName', () => ({ useSubnetName: () => name.value }))
vi.mock('../helpers/terminalHelper', () => ({ inApp: () => false, openTerminal, terminalReaches: () => true }))
vi.mock('../services/browser', () => ({ default: { isNative: false }, windowOpen: vi.fn() }))
vi.mock('./Icon', () => ({ Icon: ({ name }: any) => (name ? <i data-icon={name} /> : null) }))
vi.mock('./Confirm', () => ({
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

import { DeviceApps } from './DeviceApps'
import type { DeviceApp, DeviceAppSetting } from '../services/graphQLDeviceApps'
import { withServices } from '../test/deviceApps'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const setting = (more: Partial<DeviceAppSetting> = {}): DeviceAppSetting => ({
  name: 'ai_commands',
  type: 'bool',
  label: 'AI commands',
  help: 'Commands an AI runs on this device through MCP',
  default: true,
  value: true,
  at: null,
  by: null,
  onDevice: false,
  control: 'cloud+local',
  locked: null,
  choices: null,
  deprecated: null,
  ...more,
})

const consoleApp = (more: Partial<DeviceApp> = {}): DeviceApp =>
  withServices({
  id: 'remoteit.console',
  name: 'Console',
  publisher: 'remote.it',
  root: true,
  enabled: true,
  channel: 'stable',
  version: '1.4.0',
  state: 'running',
  detail: null,
  serviceId: 'S1',
  protocol: 'ssh',
  capabilities: ['person-accounts', 'person-certificates', 'ssh-exec'],
  hostKey: 'SHA256:abc',
  sessions: [],
  sessionsOpen: 0,
  settings: [setting()],
  ...more,
  })

const backup = (more: Partial<DeviceApp> = {}): DeviceApp =>
  withServices({
  id: 'acme.backup',
  name: 'Backup',
  publisher: 'Acme',
  root: false,
  enabled: false,
  channel: null,
  version: null,
  state: 'disabled',
  detail: null,
  serviceId: null,
  protocol: null,
  capabilities: [],
  hostKey: null,
  sessions: [],
  sessionsOpen: 0,
  settings: [
    setting({
      name: 'mode',
      type: 'choice',
      label: 'Back up',
      help: null,
      default: 'nightly',
      value: 'nightly',
      choices: [
        { value: 'nightly', label: 'Nightly' },
        { value: 'hourly', label: 'Hourly' },
      ],
    }),
    setting({ name: 'keep', type: 'int', label: 'Keep this many', help: null, default: 7, value: 7 }),
  ],
  ...more,
  })

const device = (permissions = ['VIEW', 'CONNECT', 'MANAGE', 'SCRIPTING']) =>
  ({
    id: 'D1',
    name: 'Pi',
    permissions,
    services: [
      { id: 'S1', port: 2222 },
      { id: 'S3', port: 30022 },
    ],
  } as unknown as IDevice)

const turn = vi.fn()
const setRelease = vi.fn()
const setSetting = vi.fn()

let root: Root
let container: HTMLElement
async function render(node: React.ReactNode) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(node))
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

beforeEach(() => {
  turn.mockReset().mockResolvedValue(true)
  setSetting.mockReset().mockResolvedValue(true)
  openTerminal.mockReset()
  push.mockReset()
  name.value = 'pi-evan.on.remote.it'
  apps.value = { apps: [consoleApp(), backup()], switching: undefined, turn, setRelease, setSetting }
})

const appRow = (page: HTMLElement, id: string) => page.querySelector(`[data-app="${id}"]`) as HTMLElement
const switchOf = (row: HTMLElement) => row.querySelector('[data-app-switch] input[type="checkbox"]') as HTMLInputElement
const click = (el: Element | null) => act(async () => (el as HTMLElement).click())

describe('the device’s Apps section', () => {
  it('a row each app: its name (the console as Terminal), its state in a word or two, its publisher', async () => {
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.console').textContent).toContain('Terminal')
    expect(appRow(page, 'remoteit.console').querySelector('[data-app-about]')?.textContent).toBe('Running · By remote.it')
    expect(appRow(page, 'acme.backup').querySelector('[data-app-about]')?.textContent).toBe('Off · By Acme')
    // Its settings are on its own page now.
    expect(page.querySelector('[data-app-settings]')).toBeNull()
  })

  it('a row opens the app on this device', async () => {
    const page = await render(<DeviceApps device={device()} />)
    await click(appRow(page, 'acme.backup').querySelector('[data-app-open-page]'))
    expect(push).toHaveBeenCalledWith('/devices/D1/apps/acme.backup')
  })

  it('nothing where the API has no apps, or the device none and nothing to add', async () => {
    apps.value = { ...apps.value, apps: null }
    let page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-device-apps]')).toBeNull()
    act(() => root.unmount())
    apps.value = { ...apps.value, apps: [], available: [] }
    page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-device-apps]')).toBeNull()
  })

  it('Add opens the catalogue for this device, only where there is something it can add, for one who manages it', async () => {
    apps.value = { ...apps.value, available: [{ id: 'remoteit.files', name: 'Files', version: '1.0.0', refused: null }] }
    let page = await render(<DeviceApps device={device()} />)
    await click(page.querySelector('[data-add-app]'))
    expect(push).toHaveBeenCalledWith('/devices/D1/apps/add')
    act(() => root.unmount())
    for (const available of [[], [{ id: 'remoteit.files', version: null, refused: null }], [{ id: 'acme.x', version: '1', refused: 'No' }]]) {
      apps.value = { ...apps.value, available }
      page = await render(<DeviceApps device={device()} />)
      expect(page.querySelector('[data-add-app]')).toBeNull()
      act(() => root.unmount())
    }
    apps.value = { ...apps.value, available: [{ id: 'remoteit.files', version: '1.0.0', refused: null }] }
    page = await render(<DeviceApps device={device(['VIEW', 'CONNECT'])} />)
    expect(page.querySelector('[data-add-app]')).toBeNull()
  })

  it('removing: listed with its state, no switch and no page', async () => {
    apps.value = { ...apps.value, apps: [{ ...backup(), state: 'removing', version: '1.2.0' }] }
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'acme.backup').querySelector('[data-app-about]')?.textContent).toBe('Removing… · By Acme')
    expect(switchOf(appRow(page, 'acme.backup'))).toBeNull()
    expect(appRow(page, 'acme.backup').querySelector('[data-app-open-page]')).toBeNull()
  })

  it('held back: why, said under it — a release waiting for root consent in warning', async () => {
    apps.value = {
      ...apps.value,
      apps: [consoleApp({ heldBack: { reason: 'consent', detail: 'A new version needs to run as root' } }), backup({ enabled: true, state: 'running', heldBack: { reason: 'pinned', detail: '' }, pinned: '1.0.0' })],
    }
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.console').querySelector('[data-app-held-back="consent"]')?.textContent).toBe(
      'Not updated: A new version needs full control'
    )
    expect(appRow(page, 'acme.backup').querySelector('[data-app-held-back="pinned"]')?.textContent).toBe('Not updated: Pinned to 1.0.0')
  })

  it('an app its product holds: "Managed by its product", its switch held', async () => {
    apps.value = { ...apps.value, apps: [backup({ locked: { product: 'Kiosks', level: 'synced' } })] }
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'acme.backup').querySelector('[data-app-locked]')?.textContent).toBe('Managed by its product Kiosks')
    expect(switchOf(appRow(page, 'acme.backup')).disabled).toBe(true)
  })

  it('kept local by its administrator (adminControl local): said, its switch held either way', async () => {
    apps.value = { ...apps.value, apps: [consoleApp({ adminControl: 'local' }), backup({ adminControl: 'local' })] }
    const page = await render(<DeviceApps device={device()} />)
    for (const id of ['remoteit.console', 'acme.backup']) {
      expect(appRow(page, id).querySelector('[data-app-admin="local"]')?.textContent).toBe(
        'Kept local by this device’s administrator: changed on the device only'
      )
      expect(switchOf(appRow(page, id)).disabled).toBe(true)
    }
  })

  it('turned off by its administrator (adminControl off): said, enabling held — disabling taken', async () => {
    apps.value = {
      ...apps.value,
      apps: [consoleApp({ adminControl: 'off', state: 'disabled', detail: 'stopped' }), backup({ adminControl: 'off' })],
    }
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'acme.backup').querySelector('[data-app-admin="off"]')?.textContent).toBe(
      'Turned off on this device by its administrator'
    )
    expect(switchOf(appRow(page, 'acme.backup')).disabled).toBe(true)
    expect(switchOf(appRow(page, 'remoteit.console')).disabled).toBe(false)
  })

  it('turned off, where graphql’s detail already says so: said once', async () => {
    apps.value = {
      ...apps.value,
      apps: [
        consoleApp({
          adminControl: 'off',
          state: 'unavailable',
          detail: 'Turned off on this device by its administrator (remoteit.console_control off)',
        }),
      ],
    }
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.console').querySelector('[data-app-admin]')).toBeNull()
  })

  it('the default control (cloud+local, cloud): nothing said', async () => {
    apps.value = { ...apps.value, apps: [consoleApp({ adminControl: 'cloud+local' }), backup({ adminControl: 'cloud' })] }
    const page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-app-admin]')).toBeNull()
  })
})

describe('the switch enables and disables', () => {
  it('a root app only once the person says yes, naming it, its publisher and full control — consentRoot passed', async () => {
    apps.value = { ...apps.value, apps: [consoleApp({ enabled: false, state: 'disabled' })] }
    const page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'remoteit.console')))
    expect(turn).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Give Console full control of this device?')
    expect(page.querySelector('[data-root-consent]')?.textContent).toContain('published by remote.it')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.console' }), true, true)
  })

  it('a restricted app that declares capabilities asks the yes to them first, in their words', async () => {
    apps.value = { ...apps.value, apps: [backup({ capabilities: ['ssh-exec'] })] }
    const page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'acme.backup')))
    expect(turn).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Allow Backup what it asks?')
    expect(page.querySelector('[data-root-consent]')?.getAttribute('data-root-consent')).toBe('capabilities')
    expect(page.querySelector('[data-confirm] [data-app-capability]')?.getAttribute('data-app-capability')).toBe('ssh-exec')
    expect(page.querySelector('[data-confirm-ok]')?.textContent).toBe('Allow and turn on')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), true, true)
  })

  it('a consent kept that covers its release (none awaited): turned on at once; one awaited asks again', async () => {
    const consent = { by: 'U1', email: null, at: '2026-11-10T00:00:00Z', version: '1.4.0', via: 'person' }
    apps.value = { ...apps.value, apps: [consoleApp({ enabled: false, state: 'disabled', rootConsent: consent })] }
    let page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'remoteit.console')))
    expect(page.querySelector('[data-confirm]')).toBeNull()
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.console' }), true)
    act(() => root.unmount())
    turn.mockClear()
    apps.value = {
      ...apps.value,
      apps: [consoleApp({ enabled: false, state: 'disabled', rootConsent: consent, awaitingRoot: '1.5.0' })],
    }
    page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'remoteit.console')))
    expect(turn).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Give Console full control of this device?')
  })

  it('a restricted app at once; any app disabled at once', async () => {
    const page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'acme.backup')))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), true)
    await click(switchOf(appRow(page, 'remoteit.console')))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.console' }), false)
  })

  it('needs Scripting as well as Manage to enable; Manage alone disables', async () => {
    const page = await render(<DeviceApps device={device(['VIEW', 'CONNECT', 'MANAGE'])} />)
    expect(switchOf(appRow(page, 'acme.backup')).disabled).toBe(true)
    expect(switchOf(appRow(page, 'remoteit.console')).disabled).toBe(false)
  })

  it('graphql’s refusal said in its words', async () => {
    turn.mockResolvedValue({ reason: 'Kept local on the device by its administrator' })
    const page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'acme.backup')))
    expect(page.textContent).toContain('Kept local on the device by its administrator')
  })
})

describe('drawn from what the API says, none by its id', () => {
  // Anyone's app whose service is ssh and that signs people in by certificate.
  const shell = consoleApp({
    id: 'acme.shell',
    name: 'Shell',
    publisher: 'Acme',
    root: false,
    serviceId: 'S3',
    capabilities: ['person-certificates'],
  })

  it('Open terminal in the row of any app whose service is ssh and that declares person-certificates, while it runs', async () => {
    apps.value.apps = [
      shell,
      backup(),
      consoleApp({ id: 'acme.web', serviceId: 'S1', protocol: 'https', capabilities: [] }),
    ]
    const page = await render(<DeviceApps device={device()} />)
    await click(appRow(page, 'acme.shell').querySelector('[data-app-terminal]'))
    expect(openTerminal).toHaveBeenCalledWith({
      name: 'pi-evan.on.remote.it',
      port: 30022,
      title: 'Shell',
      service: 'S3',
    })
    expect(appRow(page, 'acme.backup').querySelector('[data-app-terminal]')).toBeNull()
    expect(appRow(page, 'acme.web').querySelector('[data-app-terminal]')).toBeNull()
  })

  it('the console as any such app: Open terminal through its service’s port', async () => {
    const page = await render(<DeviceApps device={device()} />)
    await click(appRow(page, 'remoteit.console').querySelector('[data-app-terminal]'))
    expect(openTerminal).toHaveBeenCalledWith({
      name: 'pi-evan.on.remote.it',
      port: 2222,
      title: 'Console',
      service: 'S1',
    })
  })

  it('no Open terminal while it does not run, or without a name in device subnets', async () => {
    apps.value.apps = [{ ...shell, state: 'starting' }]
    let page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-app-terminal]')).toBeNull()
    act(() => root.unmount())
    container.remove()
    apps.value.apps = [shell]
    name.value = undefined
    page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-app-terminal]')).toBeNull()
  })

  it('its icon from how its service opens', async () => {
    apps.value.apps = [shell, backup(), consoleApp({ id: 'acme.web', protocol: 'https' })]
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'acme.shell').querySelector('[data-icon="terminal"]')).not.toBeNull()
    expect(appRow(page, 'acme.web').querySelector('[data-icon="globe"]')).not.toBeNull()
    expect(appRow(page, 'acme.backup').querySelector('[data-icon="cube"]')).not.toBeNull()
  })
})

describe('build step 9: ScreenView installed the old way', () => {
  const screenview = (more: any = {}) => ({ id: 'remoteit.screenview', name: 'ScreenView', publisher: 'remote.it', description: null, root: true,
    version: '1.0.0', refused: null, needsNewer: false, oldInstall: true, conversion: 'switch', conversionDetail: null, ...more })
  const unmount = () => {
    act(() => root.unmount())
    container.remove()
  }

  it('where it did not convert by itself and nothing refuses it: the switch, which asks for the yes to root first', async () => {
    apps.value = { ...apps.value, apps: [consoleApp()], available: [screenview()] }
    const page = await render(<DeviceApps device={device()} />)
    const offer = page.querySelector('[data-screenview-switch]')!
    expect(offer.textContent).toContain('ScreenView was installed the old way.')
    await click(offer.querySelector('[data-screenview-switch-action]'))
    expect(turn).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Give ScreenView full control of this device?')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.screenview' }), true, true)
  })

  it('a row of it disabled, to switch: offered too; one that converts by itself (waiting), on, or not flagged: not', async () => {
    apps.value = { ...apps.value, apps: [{ ...backup(), id: 'remoteit.screenview', name: 'ScreenView', root: true, oldInstall: true, conversion: 'switch' }], available: [] }
    let page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-screenview-switch]')).not.toBeNull()
    unmount()
    // Still on an old daemon (waiting): it converts by itself once it can — nothing new shown.
    for (const available of [[screenview({ oldInstall: false, conversion: null })], [screenview({ conversion: 'waiting' })]]) {
      apps.value = { ...apps.value, apps: [consoleApp()], available }
      page = await render(<DeviceApps device={device()} />)
      expect(page.querySelector('[data-screenview-switch]')).toBeNull()
      expect(page.querySelector('[data-screenview-not-converted]')).toBeNull()
      unmount()
    }
    apps.value = { ...apps.value, apps: [{ ...backup(), id: 'remoteit.screenview', enabled: true, oldInstall: false }], available: [] }
    page = await render(<DeviceApps device={device(['VIEW', 'CONNECT', 'MANAGE'])} />)
    expect(page.querySelector('[data-screenview-switch]')).toBeNull()
  })

  it('it will not convert: why, the old install left as it is — no switch, and no Add for it', async () => {
    apps.value = { ...apps.value, apps: [consoleApp()], available: [screenview({ conversion: 'refused', conversionDetail: 'Its product Kiosks keeps ScreenView off' })] }
    let page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-screenview-switch]')).toBeNull()
    expect(page.querySelector('[data-screenview-not-converted]')?.textContent).toContain(
      'It keeps running as it is, not switched to the app: Its product Kiosks keeps ScreenView off')
    expect(page.querySelector('[data-add-app]')).toBeNull()
    unmount()
    apps.value = { ...apps.value, apps: [{ ...backup(), id: 'remoteit.screenview', name: 'ScreenView', root: true, oldInstall: true, conversion: 'refused',
      conversionDetail: 'No release of the ScreenView app for this device\'s platform' }], available: [] }
    page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-screenview-not-converted]')?.textContent).toContain('for this device\'s platform')
  })

  it('converted by itself: "Converting from the old install" until the app runs', async () => {
    const converted = { ...backup(), id: 'remoteit.screenview', name: 'ScreenView', root: true, enabled: true, state: 'starting', conversion: 'converting',
      rootConsent: { by: 'remote.it', email: null, at: '2026-11-13T18:00:00.000Z', version: '1.0.0', via: 'carried' } }
    apps.value = { ...apps.value, apps: [converted], available: [] }
    let page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.screenview').querySelector('[data-app-about]')?.textContent).toBe('Converting from the old install · By Acme')
    unmount()
    apps.value = { ...apps.value, apps: [{ ...converted, state: 'running', conversion: null }], available: [] }
    page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.screenview').querySelector('[data-app-about]')?.textContent).toBe('Running · By Acme')
  })
})

