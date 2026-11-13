import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { apps, hostKey, name, openTerminal } = vi.hoisted(() => ({
  apps: { value: {} as any },
  hostKey: vi.fn(),
  name: { value: 'pi-evan.on.remote.it' as string | undefined },
  openTerminal: vi.fn(),
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
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
