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
  on: true,
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
  on: false,
  channel: null,
  version: null,
  state: 'off',
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
  apps.value = { apps: [consoleApp(), backup()], switching: undefined, turn, setSetting }
})

const appRow = (page: HTMLElement, id: string) => page.querySelector(`[data-app="${id}"]`) as HTMLElement
const switchOf = (row: HTMLElement) =>
  row.querySelector(':scope > .MuiListItem-root input[type="checkbox"]') as HTMLInputElement
const options = (row: HTMLElement) => row.querySelector('[data-app-settings]') as HTMLElement | null
const click = (el: Element | null) => act(async () => (el as HTMLElement).click())

describe('the Apps section', () => {
  it('a row each app: its name, publisher, version and channel, state, and Runs as root where it does', async () => {
    const page = await render(<DeviceApps device={device()} />)
    expect(page.querySelectorAll('[data-app]')).toHaveLength(2)

    const console = appRow(page, 'remoteit.console')
    expect(console.querySelector('[data-app-about]')?.textContent).toBe('By remote.it · 1.4.0 · Stable')
    expect(console.querySelector('[data-app-root]')?.textContent).toBe('Runs as root: full control of this device')
    expect(console.querySelector('[data-app-state]')?.textContent).toBe(
      'Running — logins by certificate, nothing listening on the device'
    )
    expect(switchOf(console).checked).toBe(true)

    const other = appRow(page, 'acme.backup')
    expect(other.textContent).toContain('Backup')
    expect(other.querySelector('[data-app-about]')?.textContent).toBe('By Acme')
    expect(other.querySelector('[data-app-root]')).toBeNull()
    expect(other.querySelector('[data-app-restricted]')?.textContent).toBe('Runs restricted: an account of its own on this device')
    expect(console.querySelector('[data-app-restricted]')).toBeNull()
    expect(other.querySelector('[data-app-state]')?.textContent).toBe('Off')
    expect(other.querySelector(':scope > .MuiListItem-root [data-icon]')?.getAttribute('data-icon')).toBe('cube')
  })

  it('nothing where the API has no apps, or the device none', async () => {
    for (const list of [null, undefined, []]) {
      apps.value = { apps: list, turn, setSetting }
      const page = await render(<DeviceApps device={device()} />)
      expect(page.innerHTML).toBe('')
      act(() => root.unmount())
    }
    await render(null)
  })

  it('says why an app is not available, and while it is waited for', async () => {
    apps.value.apps = [
      backup({ on: true, state: 'unavailable', detail: 'Not allowed on this device by its administrator' }),
    ]
    let page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'acme.backup').querySelector('[data-app-state]')?.textContent).toBe(
      'Not available here: Not allowed on this device by its administrator'
    )
    act(() => root.unmount())
    apps.value = { ...apps.value, switching: 'acme.backup' }
    page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'acme.backup').querySelector('[data-app-state]')?.textContent).toBe('Waiting for the device…')
  })
})

describe('an app’s settings are its options', () => {
  it('inside its row, with no icon of their own, never a row of their own — the console’s ai_commands says what it allows', async () => {
    const page = await render(<DeviceApps device={device()} />)
    const console = appRow(page, 'remoteit.console')
    const list = options(console)!
    expect(list).not.toBeNull()
    // The option is in the app's row, under its name: no icon, no app row of its own.
    expect(list.querySelectorAll('[data-icon]')).toHaveLength(0)
    expect(list.querySelector('[data-app]')).toBeNull()
    expect(list.textContent).toContain('Allow AI commands')
    expect(list.textContent).not.toMatch(/^AI commands/)
    expect(page.querySelectorAll('[data-app]')).toHaveLength(2)
  })

  it('a bool switched here through setDeviceAppSetting', async () => {
    const page = await render(<DeviceApps device={device()} />)
    const input = options(appRow(page, 'remoteit.console'))!.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input.checked).toBe(true)
    await click(input)
    expect(setSetting).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.console' }), 'ai_commands', false)
  })

  it('the setting row’s notes: set on the device, its administrator’s control, its product’s lock', async () => {
    const cases: [Partial<DeviceAppSetting>, string, boolean][] = [
      [{ value: false, onDevice: true, by: 'bob' }, 'Set on the device by bob', false],
      [{ control: 'off' }, 'Turned off on the device by its administrator', true],
      [{ locked: { product: 'Acme', level: 'synced' } }, 'Set by its product Acme', true],
    ]
    for (const [more, note, locked] of cases) {
      apps.value.apps = [consoleApp({ settings: [setting(more)] })]
      const page = await render(<DeviceApps device={device()} />)
      const list = options(appRow(page, 'remoteit.console'))!
      expect(list.textContent).toBe(`Allow AI commands${note}`)
      expect((list.querySelector('input[type="checkbox"]') as HTMLInputElement).disabled).toBe(locked)
      act(() => root.unmount())
    }
    await render(null)
  })

  it('an app its product turns on or off: said as a setting’s product lock is, and its switch held', async () => {
    apps.value.apps = [
      consoleApp({ locked: { product: 'Acme', level: 'synced' } }),
      backup({ locked: { product: 'Acme', level: 'enforced' } }),
    ]
    const page = await render(<DeviceApps device={device()} />)
    const held = appRow(page, 'remoteit.console')
    expect(held.querySelector('[data-app-locked]')!.textContent).toBe('Set by its product Acme')
    expect(switchOf(held).disabled).toBe(true)
    const enforced = appRow(page, 'acme.backup')
    expect(enforced.querySelector('[data-app-locked]')!.textContent).toBe('Managed by product Acme (enforced)')
    expect(switchOf(enforced).disabled).toBe(true)
    // Its settings are their own: one its product does not set stays the device's to change.
    expect((options(held)!.querySelector('input[type="checkbox"]') as HTMLInputElement).disabled).toBe(false)

    apps.value.apps = [consoleApp({ locked: null })]
    act(() => root.unmount())
    container.remove()
    const free = await render(<DeviceApps device={device()} />)
    expect(appRow(free, 'remoteit.console').querySelector('[data-app-locked]')).toBeNull()
    expect(switchOf(appRow(free, 'remoteit.console')).disabled).toBe(false)
  })

  it('a deprecated setting: shown with why where a value is set, not offered where none is', async () => {
    apps.value.apps = [
      backup({
        settings: [
          setting({ name: 'old', label: 'Old way', deprecated: 'use mode', at: '2026-11-13T18:00:00.000Z' }),
          setting({ name: 'older', label: 'Older way', deprecated: 'gone soon', at: null }),
        ],
      }),
    ]
    const page = await render(<DeviceApps device={device()} />)
    const list = options(appRow(page, 'acme.backup'))!
    expect(list.textContent).toContain('Old way')
    expect(list.textContent).toContain('Deprecated: use mode')
    expect(list.textContent).not.toContain('Older way')
  })

  it('a choice and an int from their declaration', async () => {
    const page = await render(<DeviceApps device={device()} />)
    const list = options(appRow(page, 'acme.backup'))!
    expect(list.textContent).toContain('Back up')
    expect(list.textContent).toContain('Nightly')
    const field = list.querySelector('[data-app-setting="keep"] input') as HTMLInputElement
    expect(field.value).toBe('7')
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(field, '14')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => field.dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
    expect(setSetting).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), 'keep', 14)
  })

  it('read-only for one who does not manage the device', async () => {
    const page = await render(<DeviceApps device={device(['VIEW', 'CONNECT'])} />)
    const input = options(appRow(page, 'remoteit.console'))!.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })
})

describe('turning an app on', () => {
  it('a root app only once the person says yes, naming it, its publisher and full control — consentRoot passed', async () => {
    apps.value.apps = [consoleApp({ on: false, state: 'off' })]
    const page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'remoteit.console')))
    expect(turn).not.toHaveBeenCalled()
    const confirm = page.querySelector('[data-confirm]')!
    expect(confirm.querySelector('[data-confirm-title]')?.textContent).toBe('Run Console as root?')
    expect(confirm.textContent).toContain(
      'Console, published by remote.it, runs as root: it gets full control of this device'
    )
    await click(confirm.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.console' }), true, true)
    expect(page.querySelector('[data-confirm]')).toBeNull()
  })

  it('a root app not turned on when the person says no', async () => {
    apps.value.apps = [consoleApp({ on: false, state: 'off' })]
    const page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'remoteit.console')))
    await click(page.querySelector('[data-confirm-deny]'))
    expect(turn).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm]')).toBeNull()
  })

  it('a restricted app at once, without consent; any app turned off at once', async () => {
    const page = await render(<DeviceApps device={device()} />)
    await click(switchOf(appRow(page, 'acme.backup')))
    expect(turn).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'acme.backup' }), true)
    await click(switchOf(appRow(page, 'remoteit.console')))
    expect(turn).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'remoteit.console' }), false)
    expect(page.querySelector('[data-confirm]')).toBeNull()
  })

  it('needs Scripting as well as Manage to turn on; Manage alone turns off', async () => {
    const page = await render(<DeviceApps device={device(['VIEW', 'CONNECT', 'MANAGE'])} />)
    expect(switchOf(appRow(page, 'acme.backup')).disabled).toBe(true)
    expect(switchOf(appRow(page, 'remoteit.console')).disabled).toBe(false)
  })
})

describe('the console’s extras, keyed by remoteit.console', () => {
  it('Open terminal and the host key while it runs, through its service’s port', async () => {
    const page = await render(<DeviceApps device={device()} />)
    const console = appRow(page, 'remoteit.console')
    expect(console.querySelector('[data-host-key]')?.textContent).toBe('Host key SHA256:abc')
    expect(hostKey).toHaveBeenCalledWith('S1')
    const open = Array.from(console.querySelectorAll('button')).find(b => b.textContent === 'Open terminal')!
    await click(open)
    expect(openTerminal).toHaveBeenCalledWith({
      name: 'pi-evan.on.remote.it',
      port: 2222,
      title: 'Console',
      service: 'S1',
    })
    expect(console.querySelector(':scope > .MuiListItem-root [data-icon]')?.getAttribute('data-icon')).toBe('terminal')
  })

  it('neither while it does not run, nor without a name in device subnets', async () => {
    apps.value.apps = [consoleApp({ on: false, state: 'off', serviceId: null })]
    let page = await render(<DeviceApps device={device()} />)
    expect(page.textContent).not.toContain('Open terminal')
    expect(page.querySelector('[data-host-key]')).toBeNull()
    expect(hostKey).not.toHaveBeenCalled()
    act(() => root.unmount())
    apps.value.apps = [consoleApp()]
    name.value = undefined
    page = await render(<DeviceApps device={device()} />)
    expect(page.textContent).not.toContain('Open terminal')
  })

  it('no other app has them', async () => {
    apps.value.apps = [backup({ on: true, state: 'running', serviceId: 'S1' })]
    const page = await render(<DeviceApps device={device()} />)
    expect(page.textContent).not.toContain('Open terminal')
    expect(page.querySelector('[data-host-key]')).toBeNull()
    expect(appRow(page, 'acme.backup').querySelector('[data-app-state]')?.textContent).toBe('Running')
  })
})

describe('a deprecated setting set: Clear', () => {
  it('offered where a value is set, clearing it back to its default (null); not on a setting that is not deprecated', async () => {
    apps.value.apps = [
      backup({
        settings: [
          setting({ name: 'old', label: 'Old way', deprecated: 'use mode', at: '2026-11-13T18:00:00.000Z' }),
          setting({ name: 'mode', label: 'Mode', at: '2026-11-13T18:00:00.000Z' }),
        ],
      }),
    ]
    const page = await render(<DeviceApps device={device()} />)
    const list = options(appRow(page, 'acme.backup'))!
    expect(list.querySelector('[data-app-setting-clear="mode"]')).toBeNull()
    const clear = list.querySelector('[data-app-setting-clear="old"]') as HTMLButtonElement
    expect(clear.textContent).toBe('Clear: back to its default')
    await click(clear)
    expect(setSetting).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.backup' }), 'old', null)
  })

  it('held where its administrator or product holds it, and for one who does not manage the device', async () => {
    const old = setting({ name: 'old', label: 'Old way', deprecated: 'use mode', at: '2026-11-13T18:00:00.000Z' })
    apps.value.apps = [backup({ settings: [{ ...old, control: 'off' }] })]
    let page = await render(<DeviceApps device={device()} />)
    expect((page.querySelector('[data-app-setting-clear="old"]') as HTMLButtonElement).disabled).toBe(true)
    act(() => root.unmount())
    apps.value.apps = [backup({ settings: [old] })]
    page = await render(<DeviceApps device={device(['VIEW', 'CONNECT'])} />)
    expect((page.querySelector('[data-app-setting-clear="old"]') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('root, consented to', () => {
  const consent = (more: any = {}) => ({
    by: 'AAAA',
    email: 'pat@example.com',
    at: '2026-11-13T18:00:00.000Z',
    version: '1.4.0',
    via: 'person',
    ...more,
  })

  it('who consented and when; its product’s, the registration’s, the device’s own, said as such', async () => {
    apps.value.apps = [consoleApp({ rootConsent: consent() })]
    let page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.console').querySelector('[data-app-consent]')?.textContent).toMatch(
      /^Consented to run as root by pat@example.com, /
    )
    for (const [via, words] of [
      ['product', /^Runs as root by its product’s consent: pat@example.com, /],
      ['registration', /^Runs as root since this device registered, /],
      ['device', /^Turned on as root on the device by root, /],
    ] as const) {
      act(() => root.unmount())
      apps.value.apps = [
        consoleApp({ rootConsent: consent({ via, ...(via === 'device' && { by: 'root', email: null }) }) }),
      ]
      page = await render(<DeviceApps device={device()} />)
      expect(appRow(page, 'remoteit.console').querySelector('[data-app-consent]')?.textContent).toMatch(words)
    }
  })

  it('a new version that needs to run as root: said, and Consent… asks in words — the yes turns it on again with consentRoot', async () => {
    apps.value.apps = [consoleApp({ rootConsent: null, awaitingRoot: '1.5.0', version: '1.4.0' })]
    const page = await render(<DeviceApps device={device()} />)
    const row = appRow(page, 'remoteit.console')
    expect(row.querySelector('[data-app-needs-consent]')?.textContent).toBe(
      'A new version (1.5.0) needs to run as root: this device stays on the version it runs until you consent'
    )
    expect(row.querySelector('[data-app-consent]')).toBeNull()
    await click(row.querySelector('[data-app-consent-action]'))
    const confirm = page.querySelector('[data-confirm]')!
    expect(confirm.querySelector('[data-root-consent-update]')?.textContent).toBe(
      'Console 1.5.0 needs to run as root. This device stays on the version it runs until you consent.'
    )
    expect(confirm.textContent).toContain('runs as root: it gets full control of this device')
    expect(confirm.querySelector('[data-confirm-ok]')?.textContent).toBe('Consent and update')
    await click(confirm.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.console' }), true, true)
  })

  it('needs Scripting to consent; one its product holds is consented to on the product’s page', async () => {
    apps.value.apps = [consoleApp({ awaitingRoot: '1.5.0' })]
    let page = await render(<DeviceApps device={device(['VIEW', 'CONNECT', 'MANAGE'])} />)
    expect(
      (appRow(page, 'remoteit.console').querySelector('[data-app-consent-action]') as HTMLButtonElement).disabled
    ).toBe(true)
    act(() => root.unmount())
    apps.value.apps = [consoleApp({ awaitingRoot: '1.5.0', locked: { product: 'Fleet', level: 'synced' } })]
    page = await render(<DeviceApps device={device()} />)
    const row = appRow(page, 'remoteit.console')
    expect(row.querySelector('[data-app-consent-action]')).toBeNull()
    expect(row.querySelector('[data-app-needs-consent]')?.textContent).toBe(
      'A new version (1.5.0) needs to run as root: its product’s page asks for consent'
    )
  })

  it('its administrator refusing root apps (apps_root_control off): said plainly', async () => {
    apps.value.apps = [
      consoleApp({
        state: 'unavailable',
        detail: 'Not allowed on this device by its administrator: no apps that run as root (apps_root_control off)',
      }),
    ]
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.console').querySelector('[data-app-state]')?.textContent).toBe(
      'Not allowed here: this device’s administrator does not allow apps that run as root (apps_root_control off)'
    )
  })
})

describe('build step 5: any app, restricted or root, opened by its type', () => {
  const files = (more: Partial<DeviceApp> = {}): DeviceApp => ({
    id: 'remoteit.files',
    name: 'Files',
    publisher: 'remote.it',
    root: false,
    on: true,
    channel: null,
    version: '1.0.0',
    state: 'running',
    detail: null,
    serviceId: 'S7',
    settings: [
      setting({
        name: 'root',
        type: 'string',
        label: 'Folder shown',
        help: null,
        default: '/',
        value: '/',
        declaration: { string: { max: 8, pattern: '/[a-z/]*' } },
      }),
    ],
    ...more,
  })
  const type = async (field: HTMLInputElement, text: string) => {
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(field, text)
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => field.dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
  }

  it('Open, while it runs with a service: its connection started and launched by its type; none while off, or for the console', async () => {
    apps.value.apps = [consoleApp(), files()]
    let page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.console').querySelector('[data-app-open]')).toBeNull()
    await click(appRow(page, 'remoteit.files').querySelector('[data-app-open]'))
    expect(push).toHaveBeenCalledWith({ pathname: '/devices/D1/S7/connect', state: { autoConnect: true, autoLaunch: true } })
    act(() => root.unmount())
    apps.value.apps = [files({ state: 'starting' }), backup({ on: true, state: 'running', serviceId: null })]
    page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-app-open]')).toBeNull()
  })

  it('a release this device\'s remote.it is too old for: Needs a newer remote.it', async () => {
    apps.value.apps = [files({ state: 'unavailable', detail: 'Needs a newer remote.it on this device', serviceId: null })]
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'remoteit.files').querySelector('[data-app-state]')?.textContent).toBe(
      'Needs a newer remote.it on this device'
    )
  })

  it('a string setting honours its max and pattern: another value is said and not sent', async () => {
    apps.value.apps = [files()]
    const page = await render(<DeviceApps device={device()} />)
    const field = page.querySelector('[data-app-setting="root"] input') as HTMLInputElement
    expect(field.maxLength).toBe(8)
    await type(field, 'Data')
    expect(setSetting).not.toHaveBeenCalled()
    expect(page.querySelector('[data-app-setting="root"]')?.textContent).toContain('Must match /[a-z/]*')
    await type(field, '/srv')
    expect(setSetting).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.files' }), 'root', '/srv')
  })

  it('an int\'s bounds and a list\'s most items', async () => {
    apps.value.apps = [
      backup({
        settings: [
          setting({ name: 'keep', type: 'int', label: 'Keep', help: null, default: 7, value: 7, declaration: { min: 1, max: 30 } }),
          setting({ name: 'paths', type: 'list', label: 'Paths', help: null, default: [], value: [], declaration: { maxItems: 1, item: { max: 4, pattern: null } } }),
        ],
      }),
    ]
    const page = await render(<DeviceApps device={device()} />)
    await type(page.querySelector('[data-app-setting="keep"] input') as HTMLInputElement, '99')
    expect(page.querySelector('[data-app-setting="keep"]')?.textContent).toContain('From 1 to 30')
    expect(setSetting).not.toHaveBeenCalled()
  })
})

describe('Add an app', () => {
  const available = (more: any = {}) => ({
    id: 'remoteit.files',
    name: 'Files',
    publisher: 'remote.it',
    description: 'Browse a folder',
    root: false,
    version: '1.0.0',
    refused: null,
    needsNewer: false,
    ...more,
  })
  const dialog = () => document.body.querySelector('[data-add-app-dialog]') as HTMLElement

  it('offered from Device.availableApps, even on a device with no app yet; Add turns a restricted one on at once', async () => {
    apps.value = { ...apps.value, apps: [], available: [available()] }
    const page = await render(<DeviceApps device={device()} />)
    await click(page.querySelector('[data-add-app]'))
    const offer = dialog().querySelector('[data-available-app="remoteit.files"]') as HTMLElement
    expect(offer.textContent).toContain('By remote.it · 1.0.0')
    expect(offer.querySelector('[data-available-runs]')?.textContent).toBe('Runs restricted: an account of its own on this device')
    await click(offer.querySelector('[data-available-add]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'remoteit.files', on: false }), true)
  })

  it('a root app asks first, in words; refused, no release, or a remote.it too old: said', async () => {
    apps.value = {
      ...apps.value,
      apps: [],
      available: [
        available({ id: 'acme.agent', name: 'Agent', publisher: 'Acme', root: true }),
        available({ id: 'acme.off', name: 'Off', refused: 'Not allowed on this device by its administrator: no apps (apps_control off)' }),
        available({ id: 'acme.none', name: 'None', version: null }),
        available({ id: 'acme.new', name: 'New', needsNewer: true }),
      ],
    }
    const page = await render(<DeviceApps device={device()} />)
    await click(page.querySelector('[data-add-app]'))
    const offer = (id: string) => dialog().querySelector(`[data-available-app="${id}"]`) as HTMLElement
    expect(offer('acme.agent').querySelector('[data-available-runs]')?.textContent).toBe('Runs as root: full control of this device')
    expect(offer('acme.off').querySelector('[data-available-why]')?.textContent).toMatch(/apps_control off/)
    expect((offer('acme.off').querySelector('[data-available-add]') as HTMLButtonElement).disabled).toBe(true)
    expect(offer('acme.none').querySelector('[data-available-why]')?.textContent).toBe('No release of it here yet')
    expect(offer('acme.new').querySelector('[data-available-newer]')).not.toBeNull()
    expect((offer('acme.new').querySelector('[data-available-add]') as HTMLButtonElement).disabled).toBe(false)
    await click(offer('acme.agent').querySelector('[data-available-add]'))
    expect(turn).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm-title]')?.textContent).toBe('Run Agent as root?')
    await click(page.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme.agent' }), true, true)
  })

  it('needs Scripting to add; nothing offered, nothing shown', async () => {
    apps.value = { ...apps.value, apps: [consoleApp()], available: [available()] }
    let page = await render(<DeviceApps device={device(['VIEW', 'CONNECT', 'MANAGE'])} />)
    await click(page.querySelector('[data-add-app]'))
    expect((dialog().querySelector('[data-available-add]') as HTMLButtonElement).disabled).toBe(true)
    expect(dialog().querySelector('[data-add-app-scripting]')).not.toBeNull()
    act(() => root.unmount())
    apps.value = { ...apps.value, available: [] }
    page = await render(<DeviceApps device={device()} />)
    expect(page.querySelector('[data-add-app]')).toBeNull()
  })
})

describe('build step 7: a publisher\'s app as the device reports it', () => {
  it('the publisher\'s name on the row; a setting\'s problem said; the device refusing its signature said', async () => {
    apps.value.apps = [
      backup({
        on: true,
        state: 'unavailable',
        detail: "Its publisher's signature did not verify on the device: the publisher certificate of acme expired",
        problems: [{ name: 'retention', error: 'no-such-setting', detail: 'acme.backup.retention_control: no such setting, removed in 1.0.0' }],
      }),
    ]
    const page = await render(<DeviceApps device={device()} />)
    const row = appRow(page, 'acme.backup')
    expect(row.querySelector('[data-app-about]')?.textContent).toBe('By Acme')
    expect(row.querySelector('[data-app-problem="retention"]')?.textContent).toBe('acme.backup.retention_control: no such setting, removed in 1.0.0')
    expect(row.querySelector('[data-app-state]')?.textContent).toMatch(/signature did not verify/)
  })
})

describe('build step 8: Verified beside the publisher', () => {
  it('on the app\'s row and where it is offered', async () => {
    apps.value = { ...apps.value, apps: [backup({ publisherVerifiedDomain: 'acme.com' })],
      available: [{ id: 'acme.sync', name: 'Sync', publisher: 'Acme', publisherVerifiedDomain: 'acme.com', description: null, root: false, version: '1.0.0', refused: null, needsNewer: false }] }
    const page = await render(<DeviceApps device={device()} />)
    expect(appRow(page, 'acme.backup').querySelector('[data-app-about]')?.textContent).toBe('By Acme · Verified: acme.com')
    await click(page.querySelector('[data-add-app]'))
    expect(document.body.querySelector('[data-available-app="acme.sync"]')?.textContent).toContain('By Acme · Verified: acme.com · 1.0.0')
  })
})
