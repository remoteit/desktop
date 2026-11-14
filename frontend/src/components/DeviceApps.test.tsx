import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { apps, hostKey, name, openTerminal, push } = vi.hoisted(() => ({
  push: vi.fn(),
  apps: { value: {} as any },
  hostKey: vi.fn(),
  name: { value: 'pi-evan.on.remote.it' as string | undefined },
  openTerminal: vi.fn(),
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../services/graphQLDeviceApps', async importOriginal => ({
  ...(await importOriginal<any>()),
  graphQLSshHostKey: hostKey,
}))
vi.mock('../hooks/useDeviceApps', () => ({ useDeviceApps: () => apps.value }))
vi.mock('../hooks/useDeviceSettings', () => ({ useDeviceSettings: () => ({ setting: () => undefined }) }))
vi.mock('../hooks/useLocalSubnetName', () => ({ useSubnetName: () => name.value }))
vi.mock('../helpers/terminalHelper', () => ({ openTerminal }))
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

const consoleApp = (more: Partial<DeviceApp> = {}): DeviceApp => ({
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
  settings: [setting()],
  ...more,
})

const backup = (more: Partial<DeviceApp> = {}): DeviceApp => ({
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
  ({ id: 'D1', name: 'Pi', permissions, services: [{ id: 'S1', port: 2222 }] } as unknown as IDevice)

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
  hostKey.mockReset().mockResolvedValue('SHA256:abc')
  openTerminal.mockReset()
  push.mockReset()
  name.value = 'pi-evan.on.remote.it'
  apps.value = { apps: [consoleApp(), backup()], switching: undefined, turn, setRelease, setSetting }
})

const appRow = (page: HTMLElement, id: string) => page.querySelector(`[data-app="${id}"]`) as HTMLElement
const switchOf = (row: HTMLElement) => row.querySelector('[data-app-switch] input[type="checkbox"]') as HTMLInputElement
const click = (el: Element | null) => act(async () => (el as HTMLElement).click())

describe('the device’s Apps section', () => {
  it('a row each app: its name, publisher, Runs as root or Restricted, the version it runs, its state in a word', async () => {
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.console').textContent).toContain('Console')
    expect(appRow(page, 'remoteit.console').querySelector('[data-app-about]')?.textContent).toBe(
      'remote.it · Runs as root · 1.4.0 · Running'
    )
    expect(appRow(page, 'acme.backup').querySelector('[data-app-about]')?.textContent).toBe('Acme · Restricted · — · Disabled')
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
    expect(appRow(page, 'acme.backup').querySelector('[data-app-about]')?.textContent).toBe('Acme · Restricted · 1.2.0 · Removing…')
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
      'Held back: A new version needs to run as root'
    )
    expect(appRow(page, 'acme.backup').querySelector('[data-app-held-back="pinned"]')?.textContent).toBe('Held back: Pinned to 1.0.0')
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
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Run Console as root?')
    expect(page.querySelector('[data-root-consent]')?.textContent).toContain('published by remote.it')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.console' }), true, true)
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

describe('the console’s Open terminal stays in its row', () => {
  it('while it runs, through its service’s port; no other app has it', async () => {
    const page = await render(<DeviceApps device={device()} />)
    const button = [...appRow(page, 'remoteit.console').querySelectorAll('button')].find(b => b.textContent === 'Open terminal')
    await click(button!)
    expect(openTerminal).toHaveBeenCalledWith(expect.objectContaining({ name: 'pi-evan.on.remote.it', port: 2222, service: 'S1' }))
    expect(appRow(page, 'acme.backup').textContent).not.toContain('Open terminal')
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
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Run ScreenView as root?')
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
    expect(appRow(page, 'remoteit.screenview').querySelector('[data-app-about]')?.textContent).toBe('Acme · Runs as root · — · Converting from the old install')
    unmount()
    apps.value = { ...apps.value, apps: [{ ...converted, state: 'running', conversion: null }], available: [] }
    page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.screenview').querySelector('[data-app-about]')?.textContent).toBe('Acme · Runs as root · — · Running')
  })
})

