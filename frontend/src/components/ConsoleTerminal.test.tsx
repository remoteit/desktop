import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { apps, name, openTerminal, env } = vi.hoisted(() => ({
  apps: { value: {} as any },
  name: { value: 'pi-evan.on.remote.it' as string | undefined },
  openTerminal: vi.fn(),
  env: { isNative: false },
}))
vi.mock('../hooks/useDeviceApps', () => ({ useDeviceApps: (deviceId?: string) => (deviceId ? apps.value : {}) }))
vi.mock('../hooks/useLocalSubnetName', () => ({
  useSubnetName: (deviceId?: string) => (deviceId ? name.value : undefined),
}))
vi.mock('../helpers/terminalHelper', () => ({ openTerminal }))
vi.mock('../services/browser', () => ({ default: env, windowOpen: vi.fn() }))
vi.mock('../services/graphQLDeviceSettings', () => ({ settingLocked: (s: any) => !!s?.locked }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ onClick, title }: any) => <button data-terminal title={title} onClick={onClick} />,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { ConsoleTerminalButton, ConsoleTerminalOption } from './ConsoleTerminal'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const consoleService = { id: 'S1', name: 'Console', typeID: 28, host: 'remoteit-console', port: 22 } as IService
const sshService = { id: 'S2', name: 'SSH', typeID: 28, host: 'localhost', port: 22 } as IService
const device = (permissions = ['CONNECT', 'MANAGE']) => ({ id: 'D1', name: 'Pi', permissions } as unknown as IDevice)
const app = (state: string, extra: any = {}) => ({
  id: 'console',
  on: state !== 'off',
  state,
  detail: null,
  serviceId: state === 'off' ? null : 'S1',
  port: state === 'off' ? null : 2222,
  hostKey: null,
  version: null,
  ...extra,
})
const turn = vi.fn()

let root: Root
async function render(node: React.ReactNode) {
  const container = document.createElement('div')
  root = createRoot(container)
  await act(async () => root.render(node))
  return container
}
const click = (el: Element | null) => act(() => (el as HTMLElement).click())

beforeEach(() => {
  apps.value = { console: app('running'), switching: undefined, turn, consoleSetting: undefined }
  name.value = 'pi-evan.on.remote.it'
  env.isNative = false
  openTerminal.mockReset()
  turn.mockReset()
})
afterEach(() => act(() => root.unmount()))

describe('ConsoleTerminalOption — the console’s connect panel', () => {
  it('offers web SSH while the console runs, opening it as the Apps section does', async () => {
    const container = await render(<ConsoleTerminalOption device={device()} service={consoleService} />)
    expect(container.textContent).toBe('Open in web SSH')
    await click(container.querySelector('a'))
    expect(openTerminal).toHaveBeenCalledWith({
      name: 'pi-evan.on.remote.it',
      port: 2222,
      title: 'Console',
      service: 'S1',
    })
  })

  it('says it opens in the browser from the desktop or mobile app', async () => {
    env.isNative = true
    const container = await render(<ConsoleTerminalOption device={device()} service={consoleService} />)
    expect(container.textContent).toBe('Open in web SSH, in your browser')
  })

  it('is nothing for another SSH service, without a name in device subnets, or without apps', async () => {
    expect((await render(<ConsoleTerminalOption device={device()} service={sshService} />)).textContent).toBe('')
    act(() => root.unmount())
    name.value = undefined
    expect((await render(<ConsoleTerminalOption device={device()} service={consoleService} />)).textContent).toBe('')
    act(() => root.unmount())
    name.value = 'pi-evan.on.remote.it'
    apps.value = { console: undefined }
    expect((await render(<ConsoleTerminalOption device={device()} service={consoleService} />)).textContent).toBe('')
  })

  it('is nothing for a console service the console app does not name', async () => {
    apps.value.console = app('running', { serviceId: 'S9' })
    expect((await render(<ConsoleTerminalOption device={device()} service={consoleService} />)).textContent).toBe('')
  })

  it('says the console is off, and offers turning it on to those who manage the device', async () => {
    apps.value.console = app('off')
    const container = await render(<ConsoleTerminalOption device={device()} service={consoleService} />)
    expect(container.textContent).toBe('The console is off: turn it on to open it in web SSH Turn it on')
    await click(container.querySelector('a'))
    expect(turn).toHaveBeenCalledWith(apps.value.console, true)
  })

  it('does not offer turning it on to those who do not manage it, or when its setting is locked', async () => {
    apps.value.console = app('off')
    let container = await render(<ConsoleTerminalOption device={device(['CONNECT'])} service={consoleService} />)
    expect(container.textContent).toBe('The console is off: turn it on to open it in web SSH')
    expect(container.querySelector('a')).toBeNull()
    act(() => root.unmount())
    apps.value.consoleSetting = { name: 'console', locked: { product: 'Pumps' } }
    container = await render(<ConsoleTerminalOption device={device()} service={consoleService} />)
    expect(container.querySelector('a')).toBeNull()
  })

  it('says what the device is doing: starting, unavailable, or waited for', async () => {
    apps.value.console = app('starting')
    expect((await render(<ConsoleTerminalOption device={device()} service={consoleService} />)).textContent).toBe(
      'The console is starting: web SSH opens it once it runs'
    )
    act(() => root.unmount())
    apps.value.console = app('unavailable', { detail: 'no sshd' })
    expect((await render(<ConsoleTerminalOption device={device()} service={consoleService} />)).textContent).toBe(
      'Not available here: no sshd'
    )
    act(() => root.unmount())
    apps.value = { console: app('running'), switching: 'console', turn }
    expect((await render(<ConsoleTerminalOption device={device()} service={consoleService} />)).textContent).toBe(
      'Waiting for the device…'
    )
  })
})

describe('ConsoleTerminalButton — the console’s row in the device’s services', () => {
  it('opens web SSH while the console runs, without opening the row', async () => {
    const row = vi.fn()
    const container = await render(
      <div onClick={row}>
        <ConsoleTerminalButton device={device()} service={consoleService} />
      </div>
    )
    const button = container.querySelector('[data-terminal]')
    expect(button?.getAttribute('title')).toBe('Open in web SSH')
    await click(button)
    expect(openTerminal).toHaveBeenCalledWith(expect.objectContaining({ name: 'pi-evan.on.remote.it', port: 2222 }))
    expect(row).not.toHaveBeenCalled()
  })

  it('is nothing while the console does not run, or for another service', async () => {
    apps.value.console = app('off')
    expect((await render(<ConsoleTerminalButton device={device()} service={consoleService} />)).innerHTML).toBe('')
    act(() => root.unmount())
    apps.value.console = app('running')
    expect((await render(<ConsoleTerminalButton device={device()} service={sshService} />)).innerHTML).toBe('')
  })
})
