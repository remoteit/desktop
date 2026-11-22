import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { apps, name, openTerminal, env } = vi.hoisted(() => ({
  apps: { value: {} as any },
  name: { value: 'pi-evan.on.remote.it' as string | undefined },
  openTerminal: vi.fn(),
  env: { isNative: false },
}))
// The device's apps as the API says them; which one a service belongs to is the portal's own rule (appsHelper).
// The release a consent names is read from its catalogue entry; none here: the app's own capabilities.
vi.mock('../services/graphQLAppCatalog', () => ({ graphQLCatalogApp: () => Promise.resolve('UNSERVED') }))
vi.mock('../hooks/useDeviceApps', async () => {
  const { appServiceOf, isAppService, serviceApp } = await import('../helpers/appsHelper')
  return {
    useServiceApp: (device?: IDevice, service?: IService) => {
      const read = device && isAppService(service) ? apps.value : {}
      const app = serviceApp(read.apps, service)
      return { ...read, app, appService: appServiceOf(app, service) }
    },
  }
})
vi.mock('../hooks/useLocalSubnetName', () => ({
  useSubnetName: (deviceId?: string) => (deviceId ? name.value : undefined),
}))
vi.mock('../helpers/terminalHelper', () => ({ openTerminal }))
vi.mock('../services/browser', () => ({ default: env, windowOpen: vi.fn() }))
vi.mock('./Confirm', () => ({
  Confirm: ({ open, title, children, onConfirm, onDeny }: any) =>
    open ? (
      <span data-confirm>
        {title} {children}
        <button data-confirm-ok onClick={onConfirm} />
        <button data-confirm-deny onClick={onDeny} />
      </span>
    ) : null,
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ onClick, title }: any) => <button data-terminal title={title} onClick={onClick} />,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { AppTerminalAction, AppTerminalButton, AppTerminalOption } from './AppTerminal'
import { useServiceApp } from '../hooks/useDeviceApps'
import type { DeviceApp } from '../services/graphQLDeviceApps'
import { withServices } from '../test/deviceApps'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// Any app whose service is ssh and that signs people in by certificate: not the console, nor named anywhere.
const shellService = { id: 'S1', name: 'Shell', typeID: 28, host: 'remoteit-app-acme-shell', port: 2222 } as IService
const sshService = { id: 'S2', name: 'SSH', typeID: 28, host: 'localhost', port: 22 } as IService
const device = (permissions = ['CONNECT', 'MANAGE', 'SCRIPTING']) =>
  ({ id: 'D1', name: 'Pi', permissions, services: [shellService, sshService] } as unknown as IDevice)
const app = (state: string, extra: Partial<DeviceApp> = {}): DeviceApp =>
  withServices({
  id: 'acme.shell',
  name: 'Shell',
  publisher: 'Acme',
  root: true,
  enabled: state !== 'disabled',
  channel: 'stable',
  state: state as any,
  detail: null,
  // graphql names no service while it is disabled: it is found by its host.
  serviceId: state === 'disabled' ? null : 'S1',
  protocol: 'ssh',
  capabilities: ['person-certificates'],
  hostKey: null,
  sessions: [],
  sessionsOpen: 0,
  version: null,
  settings: [],
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

// The connect panel reads its service's app once (ServiceConnectButton) and gives it to the option.
const Option: React.FC<{ device?: IDevice; service?: IService }> = ({ device, service }) => (
  <AppTerminalOption device={device} service={service} serving={useServiceApp(device, service)} />
)

const shell = () => apps.value.apps[0]

beforeEach(() => {
  apps.value = { apps: [app('running')], switching: undefined, turn }
  name.value = 'pi-evan.on.remote.it'
  env.isNative = false
  openTerminal.mockReset()
  turn.mockReset().mockResolvedValue(true)
})
afterEach(() => act(() => root.unmount()))

describe('AppTerminalOption — the connect panel of an app’s ssh service', () => {
  it('offers web SSH while the app runs, opening it on its service’s port, titled by the app', async () => {
    const container = await render(<Option device={device()} service={shellService} />)
    expect(container.textContent).toBe('Open terminal')
    await click(container.querySelector('a'))
    expect(openTerminal).toHaveBeenCalledWith({
      name: 'pi-evan.on.remote.it',
      port: 2222,
      title: 'Shell',
      service: 'S1',
    })
  })

  it('says it opens in the browser from the desktop or mobile app', async () => {
    env.isNative = true
    const container = await render(<Option device={device()} service={shellService} />)
    expect(container.textContent).toBe('Open terminal in your browser')
  })

  it('only for an app whose service is ssh and that declares person-certificates', async () => {
    for (const extra of [
      { capabilities: [] },
      { capabilities: ['ssh-exec'] },
      { protocol: 'tcp' },
      { protocol: null },
    ]) {
      apps.value.apps = [app('running', extra)]
      expect((await render(<Option device={device()} service={shellService} />)).textContent).toBe('')
      act(() => root.unmount())
    }
    await render(null)
  })

  it('is nothing for a service no app has, without a name in device subnets, or without apps', async () => {
    expect((await render(<Option device={device()} service={sshService} />)).textContent).toBe('')
    act(() => root.unmount())
    name.value = undefined
    expect((await render(<Option device={device()} service={shellService} />)).textContent).toBe('')
    act(() => root.unmount())
    name.value = 'pi-evan.on.remote.it'
    apps.value = { apps: null }
    expect((await render(<Option device={device()} service={shellService} />)).textContent).toBe('')
  })

  it('is nothing for an app service its app does not name: an earlier one, stopped', async () => {
    apps.value.apps = [app('running', { serviceId: 'S9' })]
    expect((await render(<Option device={device()} service={shellService} />)).textContent).toBe('')
  })

  it('says the app is off, and turns it on — it runs as root — once the person says yes to that', async () => {
    apps.value.apps = [app('disabled')]
    const container = await render(<Option device={device()} service={shellService} />)
    expect(container.textContent).toBe('Shell is off. Turn it on to open the terminal. Enable it')
    await click(container.querySelector('a'))
    expect(turn).not.toHaveBeenCalled()
    expect(container.querySelector('[data-confirm]')?.textContent).toContain(
      'Shell, published by Acme, runs as root: it gets full control of this device'
    )
    expect(container.querySelector('[data-confirm]')?.textContent).toContain('Signs people in with their Remote.It certificate')
    await click(container.querySelector('[data-confirm-ok]'))
    expect(turn).toHaveBeenCalledWith(shell(), true, true)
  })

  it('not turned on when the person says no', async () => {
    apps.value.apps = [app('disabled')]
    const container = await render(<Option device={device()} service={shellService} />)
    await click(container.querySelector('a'))
    await click(container.querySelector('[data-confirm-deny]'))
    expect(turn).not.toHaveBeenCalled()
    expect(container.querySelector('[data-confirm]')).toBeNull()
  })

  it('does not offer turning it on to those who may not run code on the device: Manage and Scripting', async () => {
    apps.value.apps = [app('disabled')]
    for (const permissions of [['CONNECT'], ['CONNECT', 'MANAGE'], ['CONNECT', 'SCRIPTING']]) {
      const container = await render(<Option device={device(permissions)} service={shellService} />)
      expect(container.textContent).toBe('Shell is off. Turn it on to open the terminal.')
      expect(container.querySelector('a')).toBeNull()
      act(() => root.unmount())
    }
    await render(null)
  })

  it('says what the device is doing: starting, unavailable, or waited for', async () => {
    apps.value.apps = [app('starting')]
    expect((await render(<Option device={device()} service={shellService} />)).textContent).toBe(
      'Shell is starting. The terminal opens once it runs.'
    )
    act(() => root.unmount())
    apps.value.apps = [app('unavailable', { detail: 'no sshd' })]
    expect((await render(<Option device={device()} service={shellService} />)).textContent).toBe(
      'Not available here: no sshd'
    )
    act(() => root.unmount())
    apps.value = { apps: [app('running')], switching: 'acme.shell', turn }
    expect((await render(<Option device={device()} service={shellService} />)).textContent).toBe(
      'Waiting for the device…'
    )
  })
})

describe('AppTerminalButton — the service’s row in the device’s services', () => {
  it('opens web SSH while the app runs, without opening the row', async () => {
    const row = vi.fn()
    const container = await render(
      <div onClick={row}>
        <AppTerminalButton device={device()} service={shellService} />
      </div>
    )
    const button = container.querySelector('[data-terminal]')
    expect(button?.getAttribute('title')).toBe('Open terminal')
    await click(button)
    expect(openTerminal).toHaveBeenCalledWith(expect.objectContaining({ name: 'pi-evan.on.remote.it', port: 2222 }))
    expect(row).not.toHaveBeenCalled()
  })

  it('is nothing while the app does not run, for an app that opens no terminal, or for another service', async () => {
    apps.value.apps = [app('disabled')]
    expect((await render(<AppTerminalButton device={device()} service={shellService} />)).innerHTML).toBe('')
    act(() => root.unmount())
    apps.value.apps = [app('running', { protocol: 'https' })]
    expect((await render(<AppTerminalButton device={device()} service={shellService} />)).innerHTML).toBe('')
    act(() => root.unmount())
    apps.value.apps = [app('running')]
    expect((await render(<AppTerminalButton device={device()} service={sshService} />)).innerHTML).toBe('')
  })
})

describe('AppTerminalAction — Open terminal in the device’s Apps', () => {
  it('while it runs, through its service’s port; nothing for an app that opens no terminal', async () => {
    const action = (shell: DeviceApp) => <AppTerminalAction device={device()} app={shell} service={shell.services[0]} />
    let container = await render(action(app('running')))
    await click(container.querySelector('[data-app-terminal]'))
    expect(openTerminal).toHaveBeenCalledWith({
      name: 'pi-evan.on.remote.it',
      port: 2222,
      title: 'Shell',
      service: 'S1',
    })
    act(() => root.unmount())
    container = await render(action(app('starting')))
    expect(container.innerHTML).toBe('')
    act(() => root.unmount())
    container = await render(action(app('running', { capabilities: [] })))
    expect(container.innerHTML).toBe('')
  })
})
