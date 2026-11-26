import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
  // The page's imports reach src/i18n, which plugs this in at load.
  initReactI18next: { type: '3rdParty', init: () => {} },
}))
vi.mock('../components/Container', () => ({ Container: ({ children }: any) => <div>{children}</div> }))
vi.mock('../hooks/useThisDevice', () => ({ useThisDevice: () => null }))
vi.mock('../components/ThisDeviceSignIn', () => ({ ThisDeviceSignIn: () => null }))
const { usage, deviceApps } = vi.hoisted(() => ({ usage: vi.fn(), deviceApps: vi.fn() }))
// The device's apps as the API says them, the device read by its UID: their words and whether each serves a service.
vi.mock('../hooks/useDeviceApps', () => ({
  useDeviceApps: (uid?: string) => ({ apps: uid ? deviceApps(uid) : undefined }),
}))
vi.mock('../services/transferUsage', () => ({ fetchTransferUsage: usage, UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../helpers/dateHelper', async importOriginal => ({
  ...(await importOriginal<object>()),
  getLocale: () => 'en-US',
}))

import { ThisDevicePart, ThisDeviceView } from '../components/thisDevice/ThisDeviceView'
import { BridgeError, ThisDevice, Capability } from '../services/thisDevice'
import { createMockBridge, MockBridge, MockBridgeOptions } from '../services/thisDeviceMock'
import { TransferUsageHint } from '../components/TransferUsage'
import type { CloudExits, ReadCloudExits } from '../components/thisDevice/cloudExits'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// "This device" draws itself from the bridge's capabilities alone (device-package docs/one-app-plan.md), against a
// mock shell: what a capability is not offered for never shows, and the platform changes nothing. Three pages — the
// page itself (main), Details and Advanced — each drawn here as its part of the view.

type Props = {
  signedIn?: boolean
  part?: ThisDevicePart
  renderName?: (uid: string, name: string) => React.ReactNode
  renderExitUsage?: (shown: boolean) => React.ReactNode
  readExits?: ReadCloudExits
  exitRunsHref?: (uid: string) => string
  renderDevices?: (uid: string | undefined) => React.ReactNode
}

// A part on a mock shell's bridge: another part can be mounted on the same one (mount), as the pages share the machine.
async function mount(bridge: MockBridge, props: Props = {}) {
  const info = await bridge.transport.call('info', {})
  const device = new ThisDevice(bridge.transport, info)
  device.follow() // as thisDevice() does: info kept current from the shell's info event
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<ThisDeviceView device={device} {...props} />))
  await act(async () => {}) // the first status, exits and settings
  return { container, bridge, root }
}
const render = (options: MockBridgeOptions = {}, props: Props = {}) => mount(createMockBridge(options), props)
const sections = (c: HTMLElement) => [...c.querySelectorAll('[data-section]')].map(e => e.getAttribute('data-section'))
// Route through, the one control: its select's hidden input, the value it shows, its line, and a choice made in it.
const routeInput = (c: HTMLElement) => c.querySelector('input[data-control="route"]') as HTMLInputElement
const routeValue = (c: HTMLElement) => routeInput(c).value
const routeLine = (c: HTMLElement) => c.querySelector('[data-route]')!
async function choose(c: HTMLElement, id: string) {
  await act(async () => {
    const input = routeInput(c)
    // MUI's select: its hidden input takes the value; a change event is what the menu's click sends.
    const props = Object.keys(input).find(k => k.startsWith('__reactProps'))!
    ;(input as any)[props].onChange({ target: { value: id } })
  })
}

describe('This device', () => {
  it('shows what the desktop menu offers, and nothing it does not', async () => {
    const { container, bridge } = await render()
    expect(sections(container)).toEqual(['device', 'controls', 'access', 'route', 'more'])
    expect(container.textContent).toContain('Mock MacBook')
    expect(container.textContent).toContain('mockmacbook.on.solo.remote.it')
    const advanced = await mount(bridge, { part: 'advanced' })
    expect(sections(advanced.container)).toEqual(['settings', 'diagnostics'])
  })

  it('the page leads to Settings, and Settings to Details, Advanced and its page in Remote.It signed in', async () => {
    const links = (c: HTMLElement) =>
      [...c.querySelectorAll('[data-link]')].map(a => [a.getAttribute('data-link'), a.getAttribute('href')])
    const { container, bridge } = await render()
    expect(links(container)).toEqual([['settings', '#/this-device/settings']])
    const settings = await mount(bridge, { part: 'settings' })
    expect(links(settings.container)).toEqual([
      ['details', '#/this-device/details'],
      ['advanced', '#/this-device/advanced'],
      ['device-page', '#/devices/80:00:00:00:01:0A:BC:DE'],
    ])
    const signedOut = await mount(bridge, { part: 'settings', signedIn: false })
    expect(links(signedOut.container).map(([link]) => link)).toEqual(['details', 'advanced'])
  })

  it('no Advanced where there is nothing for it', async () => {
    const { container } = await render({ capabilities: ['status'] }, { part: 'settings' })
    expect(container.querySelector('[data-link="details"]')).not.toBeNull()
    expect(container.querySelector('[data-link="advanced"]')).toBeNull()
  })

  it('the name as the page gives it: editable there, signed in', async () => {
    const { container } = await render({}, { renderName: (uid, name) => <li data-editor={uid}>{name}</li> })
    expect(container.querySelector('[data-editor="80:00:00:00:01:0A:BC:DE"]')!.textContent).toBe('Mock MacBook')
    expect(container.querySelector('[data-name]')).toBeNull()
    const plain = await render()
    expect(plain.container.querySelector('[data-name]')!.textContent).toBe('Mock MacBook')
  })

  it('shows a phone’s permissions where the shell offers them', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings', 'permissions', 'diagnostics', 'auth']
    const { container, bridge } = await render({ capabilities: caps, info: { platform: 'ios', shell: 'capacitor' } })
    expect(sections(container)).toEqual(['device', 'controls', 'route', 'more'])
    const advanced = await mount(bridge, { part: 'advanced' })
    expect(sections(advanced.container)).toEqual(['settings', 'permissions', 'diagnostics'])
  })

  it('names the notification permission only where the shell offers it (1.8.0), and asks it', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings', 'permissions', 'diagnostics', 'auth']
    const rows = (c: HTMLElement) =>
      [...c.querySelectorAll('[data-section="permissions"] li')].map(
        li => li.querySelector('.MuiListItemText-primary')?.textContent
      )
    const without = await render({ capabilities: caps, info: { platform: 'android', shell: 'capacitor' } }, { part: 'advanced' })
    expect(rows(without.container)).toEqual(['Local network', 'VPN configuration'])

    const { container, bridge } = await render(
      { capabilities: [...caps, 'notifications'], info: { platform: 'android', shell: 'capacitor' } },
      { part: 'advanced' }
    )
    expect(rows(container)).toEqual(['Local network', 'VPN configuration', 'Notifications'])
    const row = [...container.querySelectorAll('[data-section="permissions"] li')][2]
    expect(row.textContent).toContain('notAsked')
    await act(async () => (row.querySelector('button') as HTMLButtonElement).click())
    expect(bridge.calls.filter(c => c.method === 'permissions.request').map(c => c.args)).toEqual([
      { name: 'notifications' },
    ])
    expect(row.textContent).toContain('granted')
    expect(row.querySelector('button')).toBeNull()
  })

  it('draws the same page for the same capabilities on any platform', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings']
    const html = (c: HTMLElement) => c.innerHTML.replace(/:r[0-9a-z]+:/g, ':id:') // React's generated ids differ
    for (const part of ['main', 'details', 'advanced'] as ThisDevicePart[]) {
      const mac = await render({ capabilities: caps, info: { platform: 'mac', shell: 'menu' } }, { part })
      const ios = await render({ capabilities: caps, info: { platform: 'ios', shell: 'capacitor' } }, { part })
      expect(html(ios.container)).toEqual(html(mac.container))
    }
  })

  it('shows only the device where the shell offers only its status', async () => {
    const { container } = await render({ capabilities: ['status'] })
    expect(sections(container)).toEqual(['device', 'more'])
  })

  it('a shell before Access and Protect: the same Route through, through exit.set', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings', 'diagnostics']
    const { container, bridge } = await render({ capabilities: caps })
    expect(sections(container)).toEqual(['device', 'controls', 'route', 'more'])
    expect(routeValue(container)).toBe('')
    expect(routeLine(container).getAttribute('data-route')).toBe('off')
    await choose(container, '80:00:00:00:01:0B:00:01')
    expect(bridge.calls.filter(c => c.method === 'exit.set').map(c => c.args)).toEqual([{ id: '80:00:00:00:01:0B:00:01' }])
    expect(routeValue(container)).toBe('80:00:00:00:01:0B:00:01')
    expect(routeLine(container).textContent).toBe('All traffic from this Mac goes through Office.')
    await choose(container, '')
    expect(bridge.calls.filter(c => c.method === 'exit.set').map(c => c.args)).toEqual([
      { id: '80:00:00:00:01:0B:00:01' },
      { id: null },
    ])
    expect(routeValue(container)).toBe('')
    expect(bridge.calls.filter(c => c.method === 'vpn.set')).toEqual([])
  })

  it('follows the status the shell sends', async () => {
    const { container, bridge } = await render({ capabilities: ['status', 'vpn', 'exit'] })
    await act(async () =>
      bridge.emit('status', {
        ...bridge.status,
        vpn: { on: true },
        exit: { id: 'X', name: 'US West', kind: 'remoteit', state: 'connecting' },
      })
    )
    expect(routeLine(container).textContent).toBe('Connecting to US West…')
    expect(routeValue(container)).toBe('X')
  })

  it('Access on and off; Route through one control: an exit routes through it, Off stops', async () => {
    const { container, bridge } = await render()
    const control = (name: string) =>
      container.querySelector(`[data-control="${name}"] input, input[data-control="${name}"]`) as HTMLInputElement
    const calls = (method: string) => bridge.calls.filter(c => c.method === method).map(c => c.args)
    const access = () => container.querySelector('[data-access]')!
    expect(access().getAttribute('data-access')).toBe('on')
    expect(access().textContent).toContain('This Mac’s address is mockmacbook.on.solo.remote.it.')
    expect(container.querySelector('[data-state="access"]')!.textContent).toBe('On')
    expect(container.querySelector('[data-control="protect"]')).toBeNull()

    expect(routeValue(container)).toBe('')
    expect(routeLine(container).textContent).toBe('Send all of this Mac’s internet traffic through one of your exits.')
    await choose(container, '80:00:00:00:01:0B:00:03')
    expect(calls('exit.set')).toEqual([{ id: '80:00:00:00:01:0B:00:03' }])
    expect(bridge.status.protect?.on).toBe(true)
    expect(routeValue(container)).toBe('80:00:00:00:01:0B:00:03')
    expect(routeLine(container).getAttribute('data-route')).toBe('up')
    expect(routeLine(container).textContent).toBe('All traffic from this Mac goes through US West.')

    await act(async () => control('access').click())
    expect(calls('access.set')).toEqual([{ on: false }])
    expect(access().getAttribute('data-access')).toBe('off')
    expect(container.querySelector('[data-state="access"]')!.textContent).toBe('Off')
    expect(routeValue(container)).toBe('80:00:00:00:01:0B:00:03')

    await choose(container, '')
    expect(calls('exit.set')).toEqual([{ id: '80:00:00:00:01:0B:00:03' }, { id: null }])
    expect(bridge.status.protect?.on).toBe(false)
    expect(routeValue(container)).toBe('')
    // Off says Off, though the engine keeps the exit for next time.
    expect(bridge.status.protect?.route?.id).toBe('80:00:00:00:01:0B:00:03')
    expect(routeLine(container).getAttribute('data-route')).toBe('off')
    expect(calls('protect.set')).toEqual([])
    expect(calls('protect.route')).toEqual([])
  })

  it('each state of Route through in its own words', async () => {
    const office = { id: '80:00:00:00:01:0B:00:01', name: 'Office', kind: 'device' as const }
    const cases: [string, any, string, string][] = [
      ['connecting', { on: true, route: office, changing: true }, 'connecting', 'Connecting to Office…'],
      [
        'blocked',
        { on: true, route: office, killSwitch: true, error: 'Exit unreachable — traffic blocked' },
        'blocked',
        'Office can’t be reached. Traffic is blocked until it can.',
      ],
      [
        'down, no kill switch',
        { on: true, route: office, killSwitch: false },
        'blocked',
        'Office can’t be reached. Traffic goes out directly until it can.',
      ],
      ['refused', { on: true, route: office, error: 'Exit Office is not allowed here' }, 'refused', 'Exit Office is not allowed here'],
      ['held off', { on: false, route: office, error: 'Protect is on in dev' }, 'refused', 'Protect is on in dev'],
      ['up', { on: true, route: office }, 'up', 'All traffic from this Mac goes through Office.'],
      ['off', { on: false, route: office }, 'off', 'Send all of this Mac’s internet traffic through one of your exits.'],
    ]
    for (const [name, protect, key, words] of cases) {
      const { container, bridge } = await render()
      const down = name.startsWith('down')
      await act(async () =>
        bridge.emit('status', {
          ...bridge.status,
          protect,
          exit: protect.on ? { ...office, state: down ? 'down' : protect.changing ? 'connecting' : 'up' } : undefined,
        })
      )
      expect([name, routeLine(container).getAttribute('data-route'), routeLine(container).textContent]).toEqual([
        name,
        key,
        words,
      ])
      expect(routeValue(container)).toBe(protect.on ? office.id : '')
    }
  })

  it('no exits yet: Off, said so, nothing to choose', async () => {
    const { container } = await render({ exits: [] })
    expect(routeLine(container).textContent).toBe('No exits to route through yet.')
    expect(routeInput(container).disabled).toBe(true)
  })

  it('a refusal: its reason said under the control, which stays as it was', async () => {
    const { container, bridge } = await render({ routeRefusal: 'only exits its administrator allows' })
    await choose(container, '80:00:00:00:01:0B:00:01')
    expect(container.querySelector('[data-note="route.refused"]')!.textContent).toBe(
      'Couldn’t change Route through. only exits its administrator allows'
    )
    expect(routeValue(container)).toBe('')
    expect(routeLine(container).getAttribute('data-route')).toBe('off')
    expect(bridge.status.protect?.on).toBe(false)
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('fixed by the administrator: read-only, saying so', async () => {
    const { container, bridge } = await render({ route: '80:00:00:00:01:0B:00:01' })
    await act(async () =>
      bridge.emit('status', {
        ...bridge.status,
        protect: { ...bridge.status.protect!, locked: true, lockedWhy: 'Set by this machine’s administrator' },
      })
    )
    expect(routeInput(container).disabled).toBe(true)
    expect(container.querySelector('[data-note="route.locked"]')!.textContent).toBe('Set by this machine’s administrator')
  })

  it('a shell with Protect but no exit.set: protect.route then protect.set, Off through protect.set', async () => {
    const { container, bridge } = await render({
      capabilities: ['status', 'settings', 'access', 'protect'],
      route: '80:00:00:00:01:0B:00:01',
    })
    await choose(container, '80:00:00:00:01:0B:00:01')
    expect(bridge.calls.filter(c => /^protect\./.test(c.method)).map(c => [c.method, c.args])).toEqual([
      ['protect.route', { id: '80:00:00:00:01:0B:00:01' }],
      ['protect.set', { on: true }],
    ])
    expect(routeValue(container)).toBe('80:00:00:00:01:0B:00:01')
    await choose(container, '')
    expect(bridge.calls.filter(c => c.method === 'protect.set').map(c => c.args)).toEqual([{ on: true }, { on: false }])
    expect(routeValue(container)).toBe('')
  })

  it('Route through shows Off while off, the exit kept or not, and the exit while on', async () => {
    for (const options of [
      {},
      { route: '80:00:00:00:01:0B:00:01' },
      { route: '80:00:00:00:01:0B:00:01', status: { vpn: { on: true } } as any },
    ]) {
      const { container } = await render(options)
      expect(routeValue(container)).toBe(options.status ? options.route : '')
    }
  })

  it('sets a setting by its connectd name, and leaves a locked one alone', async () => {
    const { container, bridge } = await render()
    const printers = container.querySelector('[data-setting="printers"] input') as HTMLInputElement
    expect(printers.checked).toBe(true)
    await act(async () => printers.click())
    expect(bridge.calls.find(c => c.method === 'settings.set')!.args).toEqual({ name: 'printers', value: false })
    expect((container.querySelector('[data-setting="printers"] input') as HTMLInputElement).checked).toBe(false)
    const advanced = await mount(bridge, { part: 'advanced' })
    const relay = advanced.container.querySelector('[data-setting="websocket"] input') as HTMLInputElement
    expect(relay.disabled).toBe(true)
    expect(advanced.container.querySelector('[data-setting="websocket"]')!.textContent).toContain('administrator')
  })

  it('a prompt the person cancelled says nothing; any other failure is said', async () => {
    const bridge = createMockBridge()
    const call = bridge.transport.call
    let failure: BridgeError | undefined
    bridge.transport.call = (async (method: any, args: any) => {
      if (method === 'settings.set' && failure) throw failure
      return call(method, args)
    }) as typeof call
    const { container } = await mount(bridge)
    const printers = () => container.querySelector('[data-setting="printers"] input') as HTMLInputElement
    failure = new BridgeError('cancelled', 'the administrator’s confirmation was cancelled')
    await act(async () => printers().click())
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(printers().checked).toBe(true)
    failure = new BridgeError('failed', 'the daemon did not answer')
    await act(async () => printers().click())
    expect(container.querySelector('[role="alert"]')!.textContent).toContain('the daemon did not answer')
  })

  it('the printers are Access’s: not shown while it is off', async () => {
    const { container } = await render()
    expect(container.querySelector('[data-section="access"] [data-setting="printers"]')).not.toBeNull()
    await act(async () => (container.querySelector('[data-control="access"] input') as HTMLInputElement).click())
    expect(container.querySelector('[data-setting="printers"]')).toBeNull()
  })

  it('a desktop: Allow remote access to services after Protect, on by default, just the setting', async () => {
    const { container, bridge } = await render({
      capabilities: ['status', 'vpn', 'exit', 'settings', 'diagnostics', 'access', 'protect', 'services'],
      settings: [
        { name: 'services', value: true, source: 'default' },
        { name: 'lan_services', value: false, source: 'default' },
        { name: 'printers', value: true, source: 'machine' },
      ],
    })
    // The printers are under Access (1.5.0, as the menu's Settings has them): nothing else is left to list.
    expect(sections(container)).toEqual(['device', 'controls', 'access', 'route', 'services', 'more'])
    expect(sections((await mount(bridge, { part: 'advanced' })).container)).toEqual(['diagnostics'])
    expect(container.querySelector('[data-section="access"] [data-setting="printers"]')).not.toBeNull()
    expect(container.querySelector('[data-setting="services"]')).toBeNull()
    expect(container.querySelector('[data-setting="lan_services"]')).toBeNull()
    const line = container.querySelector('[data-services]')!
    expect(line.getAttribute('data-services')).toBe('on')
    expect(line.textContent).toBe('People you share with can reach this Mac’s services.')
    await act(async () => (container.querySelector('[data-control="services"] input') as HTMLInputElement).click())
    expect(bridge.calls.filter(c => c.method === 'services.set').map(c => c.args)).toEqual([{ on: false }])
    expect(bridge.calls.filter(c => c.method === 'permissions.request' || c.method === 'permissions.get')).toEqual([])
    expect(container.querySelector('[data-services]')!.getAttribute('data-services')).toBe('off')
    expect(container.querySelectorAll('[data-services-state]').length).toBe(0)
    expect(container.textContent).not.toContain('Nothing shared yet')
  })

  it('a shell without the switch lists services among the settings, and never lan_services', async () => {
    const { container, bridge } = await render(
      {
        settings: [
          { name: 'services', value: true, source: 'default' },
          { name: 'lan_services', value: false, source: 'default' },
        ],
      },
      { part: 'advanced' }
    )
    expect(sections(container)).not.toContain('services')
    expect(container.querySelector('[data-setting="lan_services"]')).toBeNull()
    const row = container.querySelector('[data-setting="services"]')!
    expect(row.textContent).toContain('Share this device')
    await act(async () => (row.querySelector('input') as HTMLInputElement).click())
    expect(bridge.calls.find(c => c.method === 'settings.set')!.args).toEqual({ name: 'services', value: false })
  })

  const PHONE: Capability[] = [
    'status',
    'vpn',
    'exit',
    'settings',
    'permissions',
    'diagnostics',
    'auth',
    'access',
    'protect',
    'lanServices',
    'services',
  ]
  const phone = (options: MockBridgeOptions = {}, part: ThisDevicePart = 'main') =>
    render(
      {
        capabilities: PHONE,
        info: { platform: 'ios', shell: 'capacitor', deviceKind: 'iPhone' },
        settings: [{ name: 'services', value: false, source: 'default' }],
        ...options,
      },
      { part }
    )

  it('a phone: the switch after Access and Protect, in place of its setting, in a phone’s words', async () => {
    const { container } = await phone()
    // services was the phone's only setting: shown as the switch, no Settings section is left.
    expect(sections(container)).toEqual(['device', 'controls', 'access', 'route', 'services', 'more'])
    expect(sections((await phone({}, 'advanced')).container)).toEqual(['permissions', 'diagnostics'])
    expect(container.querySelector('[data-setting="services"]')).toBeNull()
    const line = container.querySelector('[data-services]')!
    expect(line.getAttribute('data-services')).toBe('off')
    expect(line.textContent).toBe('People you share with can reach devices on the network this iPhone is on.')
  })

  it('turns it on through services.set, the Local Network permission asked then, and lists what it serves', async () => {
    const { container, bridge } = await phone()
    const control = () => container.querySelector('[data-control="services"] input') as HTMLInputElement
    await act(async () => control().click())
    expect(bridge.calls.filter(c => c.method === 'services.set').map(c => c.args)).toEqual([{ on: true }])
    expect(bridge.calls.filter(c => c.method === 'lanServices.set' || c.method === 'settings.set')).toEqual([])
    expect(container.querySelector('[data-services]')!.getAttribute('data-services')).toBe('on')
    expect(bridge.status.services?.localNetworkPermission).toBe('granted')
    expect(container.querySelectorAll('[data-services-state]').length).toBe(0)
    expect(container.textContent).toContain('Nothing shared yet')
    const advanced = await mount(bridge, { part: 'advanced' })
    expect(advanced.container.querySelector('[data-section="permissions"]')!.textContent).toContain('Local networkgranted')

    // What it serves: counted on the page, listed in Details.
    const details = await mount(bridge, { part: 'details' })
    await act(async () =>
      bridge.emit('status', {
        ...bridge.status,
        served: [
          { service: 'S1', target: '192.168.1.1:80', sessions: 2 },
          { service: 'S2', target: '192.168.1.50:554', sessions: 0, lastError: 'no route to host' },
        ],
      })
    )
    const summary = container.querySelector('[data-served-summary]')!
    expect(summary.textContent).toBe('2 services · 2 connections. See them in Details.')
    expect(summary.getAttribute('href')).toBe('#/this-device/details')
    expect(container.querySelectorAll('[data-served]').length).toBe(0)
    const served = [...details.container.querySelectorAll('[data-served]')].map(e => e.textContent)
    expect(served).toEqual([
      '192.168.1.1:80Connections: 2',
      '192.168.1.50:554Connections: 0 · Last connection failed: no route to host',
    ])

    await act(async () => control().click())
    expect(bridge.calls.filter(c => c.method === 'services.set').map(c => c.args)).toEqual([
      { on: true },
      { on: false },
    ])
    expect(container.querySelector('[data-services]')!.getAttribute('data-services')).toBe('off')
    expect(container.querySelector('[data-served-summary]')).toBeNull()
    expect(details.container.querySelectorAll('[data-served]').length).toBe(0)
  })

  it('a 1.3.0 phone shell, lanServices alone: the same switch through lanServices.set', async () => {
    const { container, bridge } = await phone({
      capabilities: PHONE.filter(c => c !== 'services'),
      info: { platform: 'ios', shell: 'capacitor', deviceKind: 'iPhone', bridgeVersion: '1.3.0' },
    })
    expect(sections(container)).toContain('services')
    await act(async () => (container.querySelector('[data-control="services"] input') as HTMLInputElement).click())
    expect(bridge.calls.filter(c => c.method === 'lanServices.set').map(c => c.args)).toEqual([{ on: true }])
    expect(container.querySelector('[data-services]')!.getAttribute('data-services')).toBe('on')
  })

  it('says what keeps its services from being reached: the permission refused, no local network', async () => {
    const { container, bridge } = await phone({ localNetworkPermission: 'denied', onLocalNetwork: false })
    await act(async () => (container.querySelector('[data-control="services"] input') as HTMLInputElement).click())
    const states = [...container.querySelectorAll('[data-services-state]')].map(e => [
      e.getAttribute('data-services-state'),
      e.textContent,
    ])
    expect(states).toEqual([
      ['permission', 'Sharing needs Local Network access. Turn on Local Network for Remote.It in this iPhone’s Settings.'],
      ['network', 'This iPhone is on cellular or offline. No one can reach what you share until it is on a local network.'],
    ])
    expect(bridge.status.services?.on).toBe(true)
  })

  it('offers to ask for the Local Network permission when it was turned on from elsewhere', async () => {
    const { container, bridge } = await phone({
      settings: [{ name: 'services', value: true, source: 'cloud' }],
    })
    const ask = container.querySelector('[data-control="localNetwork"]') as HTMLButtonElement
    expect(ask).not.toBeNull()
    await act(async () => ask.click())
    expect(bridge.calls.filter(c => c.method === 'permissions.request').map(c => c.args)).toEqual([
      { name: 'localNetwork' },
    ])
    expect(container.querySelector('[data-control="localNetwork"]')).toBeNull()
  })

  it('leaves it alone where the machine’s administrator holds it', async () => {
    const { container } = await phone({
      settings: [{ name: 'services', value: false, source: 'machine', locked: true }],
    })
    expect((container.querySelector('[data-control="services"] input') as HTMLInputElement).disabled).toBe(true)
    expect(container.querySelector('[data-note="services.locked"]')!.textContent).toContain('administrator')
  })

  it('works signed out: every control through the bridge, the sign-in where the devices would be', async () => {
    const signedIn = await render()
    expect(signedIn.container.querySelector('[data-block="devices"]')).toBeNull()
    const { container, bridge } = await render(
      {},
      { signedIn: false, renderDevices: () => <div data-sign-in>Sign in to see your devices</div> }
    )
    const blocks = [...container.querySelectorAll('[data-block]')].map(e => e.getAttribute('data-block'))
    expect(blocks).toEqual(['devices', 'controls'])
    expect(container.querySelector('[data-block="devices"] [data-sign-in]')).not.toBeNull()
    expect(container.textContent).toContain('Mock MacBook')
    expect(container.querySelector('a[href^="#/devices/"]')).toBeNull()
    await act(async () => (container.querySelector('[data-control="access"] input') as HTMLInputElement).click())
    expect(container.querySelector('[data-access]')!.getAttribute('data-access')).toBe('off')
    await choose(container, '80:00:00:00:01:0B:00:01')
    expect(routeLine(container).getAttribute('data-route')).toBe('up')
    expect(bridge.calls.map(c => c.method).filter(m => /\.(set|route)$/.test(m))).toEqual(['access.set', 'exit.set'])
    expect(bridge.calls.some(c => c.method.startsWith('auth.'))).toBe(false)
  })

  it('says to update the app when the shell’s bridge is another major version', async () => {
    const { container, bridge } = await render({ info: { bridgeVersion: '2.0.0' } })
    expect(container.textContent).toContain('Update the app')
    expect(sections(container)).toEqual([])
    expect(bridge.calls.map(c => c.method)).toEqual(['info'])
  })
})

// 1.5.0: everything the menu's own Settings window shows (device-package docs/one-app-plan.md, "Settings → This
// device"), from the bridge's capabilities alone.
describe('This device has what Settings has', () => {
  const caps: Capability[] = [
    'status',
    'exit',
    'settings',
    'diagnostics',
    'access',
    'protect',
    'services',
    'logging',
    'app',
    'remove',
  ]
  const status = {
    device: {
      uid: '80:00:00:00:01:0A:BC:DE',
      name: 'Mock MacBook',
      dnsName: 'mockmacbook.on.solo.remote.it',
      owner: 'owner@example.com',
      since: '2026-10-10T20:00:00Z',
      package: '1.1.0.20261010',
      connectd: '5.6.1.20261010',
      removal: 'remove' as const,
    },
    subnet: {
      on: true,
      domain: 'on.solo.remote.it',
      ipv4: '198.18.16.12',
      range: {
        warning: '198.18.0.0/20 is shared with utun9',
        moved: { from: '198.18.0.0/20', to: '198.18.16.0/20', at: new Date().toISOString(), why: 'a VPN took it' },
      },
    },
    relay: { using: true },
  }
  const settings = [
    {
      name: 'subnet',
      value: true,
      source: 'machine' as const,
      locked: true,
      lockedWhy: 'Kept on by this machine’s administrator',
    },
    { name: 'printers', value: true, source: 'machine' as const },
    { name: 'services', value: false, source: 'machine' as const },
    { name: 'remoteit.console', value: true, source: 'cloud' as const },
    { name: 'remoteit.console.ai_commands', value: false, source: 'default' as const },
    {
      name: 'exit_node',
      value: { on: false, lan: false } as any,
      source: 'cloud' as const,
      locked: true,
      lockedWhy: 'Turned off by this machine’s administrator',
    },
    { name: 'websocket', value: 'auto', source: 'machine' as const, overridden: 'Changed from the portal to Always' },
  ]

  it('the device’s details in Details, online since on the page, and its removal last in Advanced', async () => {
    const { container, bridge } = await render({ capabilities: caps, status, settings }, { part: 'details' })
    const text = (sel: string) => container.querySelector(sel)?.textContent
    expect(text('[data-detail="owner"]')).toContain('owner@example.com')
    expect(text('[data-detail="address"]')).toContain('198.18.16.12')
    expect(text('[data-detail="uid"]')).toContain('80:00:00:00:01:0A:BC:DE')
    expect(text('[data-detail="versions"]')).toBe('VersionsApp 1.1.0.20261010 · Agent 5.6.1.20261010')
    expect(text('[data-detail="dnsName"]')).toContain('mockmacbook.on.solo.remote.it')
    expect(text('[data-detail="relay"]')).toContain('In use now')
    const main = await mount(bridge)
    expect(main.container.querySelector('[data-engine]')!.textContent).toMatch(/^OnlineSince /)
    expect(main.container.querySelector('[data-control="remove"]')).toBeNull()
    const advanced = await mount(bridge, { part: 'advanced' })
    expect(sections(advanced.container).at(-1)).toBe('remove')
    const remove = advanced.container.querySelector('[data-control="remove"]') as HTMLButtonElement
    expect(remove.textContent).toBe('Remove from this Mac…')
    await act(async () => remove.click())
    expect(bridge.calls.filter(c => c.method === 'device.remove')).toHaveLength(1)
    expect(advanced.container.textContent).not.toContain('Removed from this Mac') // the person said no
  })

  // 1.10.0: the local ports as the daemon lists them to this OS account (graphql-api docs/PROXY-GROUPS.md §15, "Local
  // ports listed per account"), in connectd's menu words; a shell or daemon without them, no section.
  it('the local ports in Details, as the daemon lists them to this account', async () => {
    const ports = [
      { id: 'm', port: 33000, bind: '127.0.0.1', proto: 'tcp', target: '80:00:00:00:00:00:00:02', tls: 'web.at.remote.it', state: 'armed', scope: 'machine' },
      { id: 'a', port: 53, bind: '127.0.0.1', proto: 'udp', target: '80:00:00:00:00:00:00:03', state: 'active', scope: 'account', person: 'P1', yours: true },
      { id: 'n', port: 33002, bind: '127.0.0.1', proto: 'tcp', target: '80:00:00:00:00:00:00:04', state: 'armed', scope: 'account', person: 'P2', email: 'kim@example.com', noOne: true },
    ]
    const { container, bridge } = await render({ capabilities: caps, status: { ...status, ports } }, { part: 'details' })
    expect([...container.querySelectorAll('[data-section="ports"] [data-port]')].map(e => e.textContent)).toEqual([
      '127.0.0.1:33000 → web.at.remote.itevery account',
      '127.0.0.1:53/udp → 80:00:00:00:00:00:00:03yours',
      "127.0.0.1:33002 → 80:00:00:00:00:00:00:04kim@example.com's: answers no one until they sign in",
    ])
    await act(async () => bridge.emit('status', { ...bridge.status, ports: [] }))
    expect(container.querySelector('[data-section="ports"]')).toBeNull()
    const older = await render({ capabilities: caps, status }, { part: 'details' })
    expect(sections(older.container)).not.toContain('ports')
  })

  it('the machine’s only one: Uninstall', async () => {
    const { container } = await render(
      { capabilities: caps, status: { ...status, device: { ...status.device, removal: 'uninstall' } }, settings },
      { part: 'advanced' }
    )
    expect(container.querySelector('[data-control="remove"]')!.textContent).toBe('Uninstall Remote.It from this Mac…')
  })

  it('under Access: the administrator’s reason, the range, and the printers', async () => {
    const { container } = await render({ capabilities: caps, status, settings })
    const access = container.querySelector('[data-section="access"]')!
    expect(access.querySelector('[data-note="range.warning"]')!.textContent).toBe(
      'Address range shared with another network'
    )
    expect(access.querySelector('[data-note="range.warning"] [title]')!.getAttribute('title')).toContain('utun9')
    expect(access.querySelector('[data-note="access.locked"]')).toBeNull() // the mock says Access unlocked
    expect(access.querySelector('[data-note="range.moved"]')!.textContent).toContain(
      'Moved to 198.18.16.0/20 because another network took 198.18.0.0/20'
    )
    expect(access.querySelector('[data-setting="printers"]')!.textContent).toContain('Show remote printers on this Mac')
    expect(container.querySelector('[data-section="settings"] [data-setting="printers"]')).toBeNull()
  })

  // The console as the API gives it: named, its setting labelled by its release, its service ssh.
  const consoleApp = {
    id: 'remoteit.console',
    name: 'Console',
    protocol: 'ssh',
    settings: [{ name: 'ai_commands', label: 'Allow AI commands' }],
  }

  it('what the device offers: reasons, a change replaced, the relay in use, and what is not served', async () => {
    deviceApps.mockReturnValue([consoleApp])
    const { container } = await render({ capabilities: caps, status, settings }, { part: 'advanced' })
    expect(deviceApps).toHaveBeenCalledWith('80:00:00:00:01:0A:BC:DE')
    const row = (name: string) => container.querySelector(`[data-section="settings"] [data-setting="${name}"]`)!
    expect(row('exit_node').textContent).toContain('Turned off by this machine’s administrator')
    expect((row('exit_node').querySelector('input') as HTMLInputElement).disabled).toBe(true)
    expect(row('remoteit.console').textContent).toContain('Console')
    expect(row('remoteit.console').textContent).toContain('Not shared while sharing is off')
    expect(row('websocket').textContent).toContain('Changed from the portal to Always')
    expect(row('websocket').textContent).toContain('In use now')
    expect(row('websocket').textContent).toContain('Automatic')
  })

  it('an app’s state as the daemon says it: disabled with why, running with its version, as the portal says it', async () => {
    const apps = [
      ...settings.filter(s => s.name !== 'remoteit.console'),
      {
        name: 'remoteit.console',
        value: false,
        source: 'machine' as const,
        app: { state: 'disabled', version: '1.4.0', detail: 'Turned off on this device by its administrator' },
      },
      { name: 'acme.backup', value: true, source: 'cloud' as const, app: { state: 'running', version: '1.2.0' } },
      { name: 'acme.files', value: true, source: 'cloud' as const, app: { state: 'unavailable', detail: 'No build for linux-mips' } },
    ]
    const { container } = await render({ capabilities: caps, status, settings: apps }, { part: 'advanced' })
    const row = (name: string) => container.querySelector(`[data-section="settings"] [data-setting="${name}"]`)!
    expect(row('remoteit.console').textContent).toContain('Disabled — Turned off on this device by its administrator 1.4.0')
    expect((row('remoteit.console').querySelector('input') as HTMLInputElement).checked).toBe(false)
    expect(row('acme.backup').textContent).toContain('Running 1.2.0')
    expect(row('acme.files').textContent).toContain('Not available here: No build for linux-mips')
  })

  it('a withdrawn release as the daemon says it: withdrawn, or kept by its administrator — in the portal’s words', async () => {
    const apps = [
      ...settings.filter(s => s.name !== 'remoteit.console'),
      { name: 'acme.backup', value: true, source: 'cloud' as const, app: { state: 'unavailable', detail: 'withdrawn by its publisher' } },
      {
        name: 'acme.files',
        value: true,
        source: 'machine' as const,
        app: { state: 'running', version: '1.2.0', detail: "kept by this device's administrator, though its release was withdrawn" },
      },
    ]
    const { container } = await render({ capabilities: caps, status, settings: apps }, { part: 'advanced' })
    const row = (name: string) => container.querySelector(`[data-section="settings"] [data-setting="${name}"]`)!
    expect(row('acme.backup').textContent).toContain('Withdrawn by its publisher')
    expect(row('acme.backup').textContent).not.toContain('Not available here')
    expect(row('acme.files').textContent).toContain('Running — Kept by this device’s administrator, though its release was withdrawn 1.2.0')
  })

  it('an app’s settings — the console’s AI commands — options of its row, in the API’s words, set by their keys', async () => {
    deviceApps.mockReturnValue([consoleApp])
    const { container, bridge } = await render({ capabilities: caps, status, settings }, { part: 'advanced' })
    const rows = [...container.querySelectorAll('[data-section="settings"] [data-setting]')]
    const at = rows.findIndex(r => r.getAttribute('data-setting') === 'remoteit.console')
    const option = rows[at + 1] as HTMLElement
    expect(option.getAttribute('data-setting')).toBe('remoteit.console.ai_commands')
    expect(option.textContent).toContain('Allow AI commands')
    expect(getComputedStyle(option).paddingLeft).toBe('32px')
    expect(option.querySelector('svg[data-icon], .MuiListItemIcon-root')).toBeNull()
    await act(async () => (option.querySelector('input') as HTMLInputElement).click())
    expect(bridge.calls.filter(c => c.method === 'settings.set').map(c => c.args)).toEqual([
      { name: 'remoteit.console.ai_commands', value: true },
    ])
  })

  it('an app the API does not name: said by its names, its options still under it, and not said to need the services', async () => {
    deviceApps.mockReturnValue(null)
    const apps = [
      ...settings.filter(s => !s.name.startsWith('remoteit.console')),
      { name: 'acme.shell', value: true, source: 'cloud' as const, app: { state: 'running', version: '1.0.0' } },
      { name: 'acme.shell.colour', value: true, source: 'default' as const },
    ]
    const { container } = await render({ capabilities: caps, status, settings: apps }, { part: 'advanced' })
    const rows = [...container.querySelectorAll('[data-section="settings"] [data-setting]')]
    const at = rows.findIndex(r => r.getAttribute('data-setting') === 'acme.shell')
    expect(rows[at].textContent).toContain('acme.shell')
    expect(rows[at].textContent).not.toContain('Not served')
    expect(rows[at + 1].getAttribute('data-setting')).toBe('acme.shell.colour')
    expect(getComputedStyle(rows[at + 1] as HTMLElement).paddingLeft).toBe('32px')
  })

  it('the detailed connection logging, and the app’s own Open at login', async () => {
    const { container, bridge } = await render(
      { capabilities: caps, status, settings, app: { openAtLogin: { on: true } } },
      { part: 'advanced' }
    )
    const logging = container.querySelector('[data-control="logging"] input') as HTMLInputElement
    expect(logging.checked).toBe(false)
    await act(async () => logging.click())
    expect(bridge.calls.filter(c => c.method === 'logging.set').map(c => c.args)).toEqual([{ detailed: true }])
    expect(container.querySelector('[data-logging]')!.getAttribute('data-logging')).toBe('on')
    const part = container.querySelector('[data-section="app"]')!
    expect(part.textContent).toContain('This Mac')
    await act(async () => (part.querySelector('[data-control="openAtLogin"] input') as HTMLInputElement).click())
    expect(bridge.calls.filter(c => c.method === 'app.set').map(c => c.args)).toEqual([{ openAtLogin: false }])
    expect(part.querySelector('[data-open-at-login]')!.getAttribute('data-open-at-login')).toBe('off')
  })

  it('a shell before 1.5.0: none of it, nothing broken', async () => {
    const { container } = await render(
      { capabilities: ['status', 'settings', 'access', 'protect', 'services'], settings },
      { part: 'advanced' }
    )
    expect(container.querySelector('[data-logging]')).toBeNull()
    expect(container.querySelector('[data-section="app"]')).toBeNull()
    expect(container.querySelector('[data-control="remove"]')).toBeNull()
  })
})

// 1.6.0: a device stopped on the machine (the menu's Quit and Stop): said plainly, its switches held, and Start where the
// shell offers it; a shell without 'start' says it is not running, as before.
describe('This device stopped', () => {
  const caps: Capability[] = ['status', 'exit', 'settings', 'access', 'protect', 'services', 'start']

  it('says stopped, holds the switches, and starts it again', async () => {
    const { container, bridge } = await render({ capabilities: caps, status: { engine: 'stopped' } })
    const engine = container.querySelector('[data-engine]')!
    expect(engine.getAttribute('data-engine')).toBe('stopped')
    expect(engine.textContent).toBe(
      'Not runningNo one can reach this Mac, and Access and Route through are off.'
    )
    const access = container.querySelector(
      '[data-control="access"] input, input[data-control="access"]'
    ) as HTMLInputElement
    expect(access.disabled).toBe(true)
    const start = container.querySelector('[data-control="start"]') as HTMLButtonElement
    expect(start.textContent).toBe('Start Remote.It')
    await act(async () => start.click())
    expect(bridge.calls.filter(c => c.method === 'device.start')).toHaveLength(1)
    expect(container.querySelector('[data-engine]')!.getAttribute('data-engine')).toBe('online')
    expect(container.querySelector('[data-control="start"]')).toBeNull()
    expect(
      (container.querySelector('[data-control="access"] input, input[data-control="access"]') as HTMLInputElement)
        .disabled
    ).toBe(false)
  })

  // A phone (no 'start'): its engine says 'stopped' whenever its tunnel is off, and the switches are what turn it on —
  // never held (Evan's Pixel, 2026-10-11: every switch greyed with the tunnel off, so nothing could start it).
  it('a shell without start: off, the switches free, no Start', async () => {
    const { container } = await render({
      capabilities: caps.filter(c => c !== 'start'),
      status: { engine: 'stopped' },
    })
    expect(container.querySelector('[data-engine]')!.textContent).toBe(
      'OffTurn on Access, Route through or Share to start Remote.It.'
    )
    expect(container.querySelector('[data-control="start"]')).toBeNull()
    const access = container.querySelector(
      '[data-control="access"] input, input[data-control="access"]'
    ) as HTMLInputElement
    expect(access.disabled).toBe(false)
  })
})

// 1.7.0: what the shell offers follows its engine, and the page follows the shell — never what it offered as the page
// opened (Evan's Mac, 2026-10-10: opened while the daemon came back, the page had no Services until opened again).
describe('This device follows what the shell offers', () => {
  const desktop: Capability[] = [
    'status',
    'vpn',
    'exit',
    'settings',
    'diagnostics',
    'auth',
    'access',
    'protect',
    'start',
  ]
  it('shows the services once the daemon that has them answers, with no reload', async () => {
    // The daemon absent as the page opened: no services, no logging, stopped.
    const { container, bridge } = await render({
      capabilities: desktop,
      status: { engine: 'stopped', device: undefined },
    })
    const advanced = await mount(bridge, { part: 'advanced' })
    expect(sections(container)).not.toContain('services')
    expect(advanced.container.querySelector('[data-logging]')).toBeNull()
    // It answers, running, with the setting: the shell offers services and logging, and says so.
    bridge.status = {
      ...bridge.status,
      engine: 'online',
      device: { uid: '80:00:00:00:01:0A:BC:DE', name: 'Mock MacBook' },
    }
    bridge.logging = { detailed: true }
    await act(async () => bridge.offer([...desktop, 'services', 'logging']))
    await act(async () => {})
    expect(sections(container)).toContain('services')
    expect(container.querySelector('[data-section="services"] input')).not.toBeNull()
    // Read when it came to be offered: the logging as the daemon has it.
    expect(advanced.container.querySelector('[data-logging]')!.getAttribute('data-logging')).toBe('on')
  })

  it('drops what the shell no longer offers', async () => {
    const { container, bridge } = await render({ capabilities: [...desktop, 'services', 'logging', 'remove'] })
    const advanced = await mount(bridge, { part: 'advanced' })
    expect(sections(container)).toContain('services')
    expect(advanced.container.querySelector('[data-logging]')).not.toBeNull()
    await act(async () => bridge.offer(desktop))
    expect(sections(container)).not.toContain('services')
    expect(advanced.container.querySelector('[data-logging]')).toBeNull()
    // A method of a capability gone is not asked again.
    const asked = bridge.calls.length
    bridge.emit('status', bridge.status)
    await act(async () => {})
    expect(bridge.calls.slice(asked).map(c => c.method)).not.toContain('logging.get')
  })

  it('reads again with each status what the engine answers and sends no event for', async () => {
    const { container, bridge } = await render({ capabilities: [...desktop, 'logging'] }, { part: 'advanced' })
    expect(container.querySelector('[data-logging]')!.getAttribute('data-logging')).toBe('off')
    bridge.logging = { detailed: true } // the menu's own Settings turned it on
    await act(async () => bridge.emit('status', { ...bridge.status }))
    await act(async () => {})
    expect(container.querySelector('[data-logging]')!.getAttribute('data-logging')).toBe('on')
  })

  it('a shell before 1.7.0 (no info event): as it offered at boot', async () => {
    const { container } = await render({ capabilities: desktop, info: { bridgeVersion: '1.6.0' } })
    expect(sections(container)).toEqual(['device', 'controls', 'access', 'route', 'more'])
  })

  describe('the account’s public-exit transfer under the exit picker', () => {
    const US_WEST = '80:00:00:00:01:0B:00:03' // remote.it's (kind remoteit)
    const OFFICE = '80:00:00:00:01:0B:00:01' // a device of the account's
    const resetsAt = '2026-12-01T00:00:00.000Z'
    const resets = new Date(resetsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    const exit = (fields = {}) => ({
      kind: 'exit',
      month: '2026-11',
      usedBytes: 8.2e9,
      allowanceBytes: 10e9,
      rateBps: 5e6,
      over: false,
      resetsAt,
      devices: [],
      ...fields,
    })
    // As the page renders it, signed in.
    const renderExitUsage = (shown: boolean) => <TransferUsageHint accountId="USER" kind="exit" shown={shown} />
    const hint = (c: HTMLElement) => c.querySelector('[data-section="route"] [data-testid="transfer-usage-hint"]')

    it.each([
      ['with an allowance', exit(), '8.2 of 10 GB this month'],
      ['over it', exit({ usedBytes: 12e9, over: true }), `Slowed to 5 Mbit/s until ${resets}`],
      ['with no allowance', exit({ allowanceBytes: null }), '8.2 GB this month'],
    ])('routed through remote.it’s exit, %s', async (_, row, text) => {
      usage.mockReset().mockResolvedValue([row])
      const { container } = await render({ route: US_WEST, status: { vpn: { on: true } } as any }, { renderExitUsage })
      expect(usage).toHaveBeenCalledWith('USER')
      expect(hint(container)!.textContent).toBe(text)
      expect(hint(container)!.getAttribute('data-over')).toBe(row.over ? 'true' : null)
    })

    it('nothing for a device’s exit, and nothing asked until remote.it’s is chosen', async () => {
      usage.mockReset().mockResolvedValue([exit()])
      const { container } = await render({ route: OFFICE }, { renderExitUsage })
      expect(hint(container)).toBeNull()
      expect(usage).not.toHaveBeenCalled()
      // Route through changed to remote.it's: asked then, and said under it.
      await choose(container, US_WEST)
      await act(async () => {})
      expect(usage).toHaveBeenCalledTimes(1)
      expect(hint(container)!.textContent).toBe('8.2 of 10 GB this month')
    })

    it('nothing where the usage cannot be read, and the page stands', async () => {
      usage.mockReset().mockResolvedValue('ERROR')
      const { container } = await render({ route: US_WEST, status: { vpn: { on: true } } as any }, { renderExitUsage })
      expect(hint(container)).toBeNull()
      expect(sections(container)).toEqual(['device', 'controls', 'access', 'route', 'more'])
      expect(container.querySelector('.MuiAlert-root')).toBeNull()
      usage.mockReset().mockRejectedValue(new Error('network'))
      expect(hint((await render({ route: US_WEST }, { renderExitUsage })).container)).toBeNull()
      usage.mockReset().mockResolvedValue('UNSUPPORTED')
      expect(hint((await render({ route: US_WEST }, { renderExitUsage })).container)).toBeNull()
    })

    it('a shell before Protect: under its exit picker, for remote.it’s exit', async () => {
      usage.mockReset().mockResolvedValue([exit()])
      const caps: Capability[] = ['status', 'vpn', 'exit', 'settings']
      const status = { vpn: { on: true }, exit: { id: US_WEST, name: 'US West', kind: 'remoteit', state: 'up' } } as any
      const { container } = await render({ capabilities: caps, status }, { renderExitUsage })
      const line = () => container.querySelector('[data-section="route"] [data-testid="transfer-usage-hint"]')
      expect(line()!.textContent).toBe('8.2 of 10 GB this month')
      const office = { vpn: { on: true }, exit: { id: OFFICE, name: 'Office', kind: 'device', state: 'up' } } as any
      const other = await render({ capabilities: caps, status: office }, { renderExitUsage })
      expect(other.container.querySelector('[data-testid="transfer-usage-hint"]')).toBeNull()
    })

    it('nothing without the page’s renderer (signed out)', async () => {
      usage.mockReset().mockResolvedValue([exit()])
      const { container } = await render({ route: US_WEST })
      expect(container.querySelector('[data-testid="transfer-usage-hint"]')).toBeNull()
      expect(usage).not.toHaveBeenCalled()
    })
  })
})

// An exit names no device: remote.it picks which of its devices carries each new connection (graphql-api
// docs/PROXY-GROUPS.md §13). Signed in, the page lists each exit the engine offers with its devices counted, and says the
// device of the machine's exit its traffic goes through now; who may not choose the machine's exit here (§15, 1.10.0's
// chooseRefusal) sees it read-only, with why, and may still turn Protect off.
describe('This device’s exits, each with its devices', () => {
  const US_WEST = '80:00:00:00:01:0B:00:03' // remote.it's
  const OFFICE = '80:00:00:00:01:0B:00:01' // one of the account's
  const MACHINE = '80:00:00:00:01:0A:BC:DE' // the mock's device
  const two = { devices: 2, carrying: 2, healthy: 2, draining: 0 }
  const cloud = (inUse: CloudExits['inUse'] = null): CloudExits => ({
    serving: new Map([
      [US_WEST, two],
      [OFFICE, { devices: 2, carrying: 1, healthy: 1, draining: 0 }],
    ]),
    inUse,
  })
  const reader = (answer: CloudExits | null) => vi.fn(async (_deviceId: string) => answer)
  const control = (c: HTMLElement, name: string) =>
    c.querySelector(`[data-control="${name}"] input, input[data-control="${name}"]`) as HTMLInputElement
  // The picker's list, opened as a click opens MUI's select: each exit's name, and its devices counted under it.
  async function listed(c: HTMLElement, name: string) {
    const field = control(c, name).parentElement!.querySelector('[role="combobox"]')!
    await act(async () => field.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })))
    const list = [...document.querySelectorAll('[role="listbox"]')].at(-1)!
    const items = [...list.querySelectorAll('[data-exit]')].map(item => [
      item.querySelector('.MuiListItemText-primary')?.textContent,
      item.querySelector('.MuiListItemText-secondary')?.textContent ?? null,
    ])
    await act(async () => list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    return items
  }
  // Each item of the open picker: its value, and whether it may be chosen.
  async function listedItems(c: HTMLElement) {
    const field = control(c, 'route').parentElement!.querySelector('[role="combobox"]')!
    await act(async () => field.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })))
    const list = [...document.querySelectorAll('[role="listbox"]')].at(-1)!
    const items = [...list.querySelectorAll('[data-exit]')].map(item => [
      item.getAttribute('data-exit'),
      item.getAttribute('aria-disabled') === 'true',
    ])
    await act(async () => list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    return items
  }
  const note = (c: HTMLElement, id: string) => c.querySelector(`[data-note="${id}"]`)?.textContent ?? null

  it('each exit with its devices counted where the page reads them, for this device; the engine’s list alone without', async () => {
    const readExits = reader(cloud())
    const { container } = await render({}, { readExits })
    expect(readExits).toHaveBeenCalledWith(MACHINE)
    expect(await listed(container, 'route')).toEqual([
      ['Off', null],
      ['Office', '1 of 2 devices carrying traffic'],
      ['US West (Remote.It)', '2 devices'],
    ])
    // The field shows Off, or the exit's name alone.
    expect(container.querySelector('[data-section="route"] [role="combobox"]')!.textContent).toBe('Off')

    const signedOut = await render()
    expect(await listed(signedOut.container, 'route')).toEqual([
      ['Off', null],
      ['Office', null],
      ['US West (Remote.It)', null],
    ])
    expect(note(signedOut.container, 'route.through')).toBeNull()
  })

  it('the device of the exit in use, while Protect is on through it; read again as the route or Protect moves', async () => {
    const readExits = reader(cloud({ id: US_WEST, through: { id: 'E2', name: 'e2' }, serving: two }))
    const on = await render({ route: US_WEST, status: { vpn: { on: true } } as any }, { readExits })
    expect(note(on.container, 'route.through')).toBe('Going out through e2 now · one of 2 devices')
    expect(on.container.querySelector('[data-section="route"] [role="combobox"]')!.textContent).toBe('US West (Remote.It)')

    // Off: nothing goes through it now.
    const off = await render({ route: US_WEST }, { readExits })
    expect(note(off.container, 'route.through')).toBeNull()
    const asked = readExits.mock.calls.length
    await choose(off.container, US_WEST)
    await act(async () => {})
    expect(readExits.mock.calls.length).toBeGreaterThan(asked)
    expect(note(off.container, 'route.through')).toBe('Going out through e2 now · one of 2 devices')

    // The account says another exit is in use than the one chosen here: not said of this one.
    const other = await render(
      { route: OFFICE, status: { vpn: { on: true } } as any },
      { readExits: reader(cloud({ id: US_WEST, through: { id: 'E2', name: 'e2' }, serving: two })) }
    )
    expect(note(other.container, 'route.through')).toBeNull()
  })

  it('who may not choose the machine’s exit here: read-only, with why; Protect off stays theirs', async () => {
    const chooseRefusal = 'Only someone who manages this device chooses its exit'
    const off = await render({ route: US_WEST, chooseRefusal }, { readExits: reader(cloud()) })
    const disabled = (c: HTMLElement) =>
      control(c, 'route').closest('.MuiInputBase-root')!.classList.contains('Mui-disabled')
    expect(disabled(off.container)).toBe(true)
    expect(note(off.container, 'route.choose')).toBe(chooseRefusal)

    const on = await render({ route: US_WEST, chooseRefusal, status: { vpn: { on: true } } as any })
    expect(disabled(on.container)).toBe(false)
    const open = [...(await listedItems(on.container))]
    expect(open).toEqual([
      ['', false],
      [OFFICE, true],
      [US_WEST, true],
    ])
    await choose(on.container, '')
    expect(on.bridge.calls.filter(c => c.method === 'exit.set').map(c => c.args)).toEqual([{ id: null }])
    expect(routeLine(on.container).getAttribute('data-route')).toBe('off')
    // Off, no exit is chosen again here.
    expect(disabled(on.container)).toBe(true)

    // A shell before 1.10.0 says nothing: the choice is offered, and the shell's refusal shown when it comes.
    const before = await render({ route: US_WEST })
    expect(disabled(before.container)).toBe(false)
    expect(note(before.container, 'route.choose')).toBeNull()
  })

  it('remote.it’s exit said so once, where its name says so already', async () => {
    const exits = [
      { id: 'pdx1a', name: 'remote.it pdx1a', kind: 'remoteit' as const },
      { id: US_WEST, name: 'US West', kind: 'remoteit' as const },
    ]
    const { container } = await render({ exits })
    expect((await listed(container, 'route')).map(([name]) => name)).toEqual(['Off', 'remote.it pdx1a', 'US West (Remote.It)'])
  })

  it('a shell before Protect: its exit picker the same, and the device in use under it', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings']
    const status = { vpn: { on: true }, exit: { id: US_WEST, name: 'US West', kind: 'remoteit', state: 'up' } } as any
    const { container } = await render(
      { capabilities: caps, status },
      { readExits: reader(cloud({ id: US_WEST, through: { id: 'E1', name: 'e1' }, serving: two })) }
    )
    expect(await listed(container, 'route')).toEqual([
      ['Off', null],
      ['Office', '1 of 2 devices carrying traffic'],
      ['US West (Remote.It)', '2 devices'],
    ])
    expect(note(container, 'route.through')).toBe('Going out through e1 now · one of 2 devices')
  })
})

// 1.12.0: the menu's two set-once items on Advanced, so they can leave the tray — the person's ssh, and offering this
// machine as an exit ("Shares its connection") — each only where the shell offers it.
describe('This device’s ssh and exit', () => {
  const caps: Capability[] = ['status', 'settings', 'access', 'protect', 'ssh', 'exitNode']
  const exits = [
    { id: 'gk3x9q2m7ab1', name: 'Office', devices: 2, inService: 2, users: 5, dormant: false, lan: true },
    { id: 'g8f2m1qz0ac4', name: 'Spare exit', devices: 0, inService: 0, users: 0, dormant: true, lan: false },
  ]
  const checks = [
    { name: 'health', passed: true, pending: false, reason: 'it is online' },
    { name: 'nat', passed: false, pending: false, reason: 'it refuses exit flows' },
  ]
  const state = (c: HTMLElement) => c.querySelector('[data-exit-node-state]')!
  const dialog = () => document.body.querySelector('[data-dialog="exit-node"]')
  const click = (e: Element | null) => act(async () => (e as HTMLElement).click())

  it('nothing of either from a shell before 1.12.0: the exit node a setting, as before', async () => {
    const { container } = await render({ capabilities: ['status', 'settings', 'access', 'protect'] }, { part: 'advanced' })
    expect(container.querySelector('[data-section="ssh"]')).toBeNull()
    expect(container.querySelector('[data-section="exit-node"]')).toBeNull()
    expect(container.querySelector('[data-section="settings"] [data-setting="exit_node"]')).not.toBeNull()
  })

  it('turns the person’s ssh on and off; signed out, it is held and says so', async () => {
    const { container, bridge } = await render({ capabilities: caps }, { part: 'advanced' })
    const part = container.querySelector('[data-section="ssh"]')!
    expect(part.textContent).toContain('Use Remote.It for ssh')
    await click(part.querySelector('[data-control="ssh"] input'))
    expect(bridge.calls.filter(c => c.method === 'ssh.set').map(c => c.args)).toEqual([{ on: true }])
    expect(part.querySelector('[data-ssh]')!.getAttribute('data-ssh')).toBe('on')
    await act(async () => bridge.emit('status', { ...bridge.status, ssh: { on: false } }))
    expect(part.querySelector('[data-ssh]')!.getAttribute('data-ssh')).toBe('off')

    const out = await render({ capabilities: caps, ssh: { on: true, needsSignIn: true } }, { part: 'advanced' })
    const held = out.container.querySelector('[data-section="ssh"]')!
    expect((held.querySelector('[data-control="ssh"] input') as HTMLInputElement).disabled).toBe(true)
    expect(held.textContent).toContain('Sign in to change it.')
  })

  it('in place of the bare Exit node row: Off, and its switch inside', async () => {
    const { container, bridge } = await render({ capabilities: caps, exitNode: { exits } }, { part: 'advanced' })
    expect(container.querySelector('[data-section="settings"] [data-setting="exit_node"]')).toBeNull()
    const part = container.querySelector('[data-section="exit-node"]')!
    expect(part.textContent).toContain('Shares its connection')
    expect(state(container).getAttribute('data-exit-node-state')).toBe('off')
    expect(state(container).textContent).toContain('Off')
    expect(part.querySelector('[data-setting="exit_node"]')!.textContent).toContain('Let this Mac be an exit device')
    expect(bridge.calls.filter(c => c.method === 'exitNode.list')).toHaveLength(1)

    bridge.status = { ...bridge.status, exitNode: undefined }
    await act(async () => bridge.emit('status', bridge.status))
    expect(container.querySelector('[data-section="exit-node"]')).toBeNull()
    expect(container.querySelector('[data-section="settings"] [data-setting="exit_node"]')).not.toBeNull()
  })

  it('joins an exit: what joining opens said first, the administrator after, then Joining with its checks', async () => {
    const { container, bridge } = await render({ capabilities: caps, exitNode: { exits, checks } }, { part: 'advanced' })
    await click(container.querySelector('[data-control="exit-choose"]'))
    expect(dialog()!.textContent).toContain('Use this Mac as an exit')
    expect(dialog()!.querySelector('[data-note="exit-lan-join"]')!.textContent).toBe(
      'Joining lets this exit’s users reach this Mac’s local network.'
    )
    expect(dialog()!.querySelector('[data-note="exit-confirm"]')!.textContent).toContain('Touch ID')
    await click(dialog()!.querySelector('[data-control="exit-go"]'))
    expect(bridge.calls.filter(c => c.method === 'exitNode.join').map(c => c.args)).toEqual([{ id: 'gk3x9q2m7ab1' }])
    expect(dialog()).toBeNull()
    expect(state(container).getAttribute('data-exit-node-state')).toBe('failed')
    expect(state(container).textContent).toContain('Not ready')
    expect(container.querySelector('[data-note="check-failed"]')!.textContent).toBe('Failed: it refuses exit flows')
    expect(container.querySelector('[data-note="exit-lan"]')!.textContent).toBe('Users of Office can reach this Mac’s local network.')
    await click(container.querySelector('[data-control="exit-check"]'))
    expect(bridge.calls.filter(c => c.method === 'exitNode.join')).toHaveLength(2)
  })

  it('creates an exit by the name given', async () => {
    const { container, bridge } = await render({ capabilities: caps, exitNode: { exits: [] } }, { part: 'advanced' })
    await click(container.querySelector('[data-control="exit-choose"]'))
    expect(dialog()!.querySelector('[data-control="exit-go"]')!.textContent).toBe('Create exit')
    const name = dialog()!.querySelector('[data-control="exit-name"]') as HTMLInputElement
    expect(name.placeholder).toBe('Mock MacBook exit')
    await click(dialog()!.querySelector('[data-control="exit-go"]'))
    expect(bridge.calls.filter(c => c.method === 'exitNode.create').map(c => c.args)).toEqual([{ name: '' }])
    expect(state(container).getAttribute('data-exit-node-state')).toBe('joining')
    expect(state(container).textContent).toContain('Starting')
  })

  it('the administrator’s no says nothing; the cloud’s refusal is said in the dialog', async () => {
    const no = await render({ capabilities: caps, exitNode: { exits, confirm: false } }, { part: 'advanced' })
    await click(no.container.querySelector('[data-control="exit-choose"]'))
    await click(dialog()!.querySelector('[data-control="exit-go"]'))
    expect(dialog()!.querySelector('[data-note="exit-error"]')).toBeNull()
    await click(document.body.querySelector('[data-dialog="exit-node"] button'))
    expect(dialog()).toBeNull()

    const { container, bridge } = await render(
      { capabilities: caps, exitNode: { exits, refusal: 'it runs Office, where 2 devices use it.' } },
      { part: 'advanced' }
    )
    await click(container.querySelector('[data-control="exit-choose"]'))
    await click(dialog()!.querySelector('[data-control="exit-go"]'))
    expect(dialog()!.querySelector('[data-note="exit-error"]')!.textContent).toBe(
      'Couldn’t join. it runs Office, where 2 devices use it.'
    )
    expect(bridge.calls.filter(c => c.method === 'exitNode.list')).toHaveLength(2)
    await click(document.body.querySelector('[data-dialog="exit-node"] button'))
    expect(dialog()).toBeNull()
  })

  it('what it runs, in one or two words, and the way to leave it where the page gives one', async () => {
    const words = { active: 'On', draining: 'Pausing', retired: 'Paused' }
    for (const [s, word] of Object.entries(words)) {
      const runs = { id: 'gk3x9q2m7ab1', name: 'Office', state: s, joining: false, lan: false }
      const { container } = await render({ capabilities: caps, exitNode: { exits, runs } }, { part: 'advanced' })
      expect(state(container).textContent).toContain(word)
      expect(container.querySelector('[data-control="exit-leave"]')).not.toBeNull()
      expect(container.querySelector('[data-control="exit-manage"]')).toBeNull()
    }
    const runs = { id: 'gk3x9q2m7ab1', name: 'Office', state: 'active', joining: false, lan: true }
    const { container } = await render(
      { capabilities: caps, exitNode: { exits, runs, status: { lanLocal: true } } },
      { part: 'advanced', exitRunsHref: uid => `#/devices/${uid}/runs` }
    )
    expect(container.querySelector('[data-control="exit-manage"]')!.getAttribute('href')).toBe(
      '#/devices/80:00:00:00:01:0A:BC:DE/runs'
    )
    expect(container.querySelector('[data-note="exit-lan"]')!.textContent).toBe(
      'This Mac decides whether users of Office reach its local network.'
    )
  })

  it('leaves the exit it runs; the cloud’s refusal is shown and it stays in', async () => {
    const runs = { id: 'gk3x9q2m7ab1', name: 'Office', state: 'retired', joining: false, lan: false }
    const { container, bridge } = await render({ capabilities: caps, exitNode: { exits, runs } }, { part: 'advanced' })
    await click(container.querySelector('[data-control="exit-leave"]'))
    expect(bridge.calls.filter(c => c.method === 'exitNode.leave')).toHaveLength(1)
    expect(state(container).getAttribute('data-exit-node-state')).toBe('off')
    expect(container.querySelector('[data-control="exit-leave"]')).toBeNull()

    const reason = 'it runs Office, where 2 devices use it: drain it there first, then retire it'
    const out = await render(
      { capabilities: caps, exitNode: { exits, runs: { ...runs, state: 'active' }, leaveRefusal: reason } },
      { part: 'advanced' }
    )
    await click(out.container.querySelector('[data-control="exit-leave"]'))
    expect(out.container.textContent).toContain(reason)
    expect(state(out.container).getAttribute('data-exit-node-state')).toBe('active')
  })

  it('held by the machine’s administrator: why, nothing asked of the cloud, no way to join', async () => {
    for (const [held, line] of [
      ['forbidden', 'This Mac’s administrator doesn’t allow exits on it.'],
      ['portal', 'This Mac’s administrator sets this in the portal only.'],
      ['viewer', 'Your account on this Mac can’t change Remote.It.'],
    ]) {
      const { container, bridge } = await render({ capabilities: caps, exitNode: { exits, status: { held } } }, { part: 'advanced' })
      expect(state(container).textContent).toContain('Not allowed')
      expect(state(container).textContent).toContain(line)
      expect(container.querySelector('[data-control="exit-choose"]')).toBeNull()
      expect(bridge.calls.filter(c => c.method === 'exitNode.list')).toHaveLength(0)
    }
  })

  it('held while the page is open: what it listed before is not said', async () => {
    const runs = { id: 'gk3x9q2m7ab1', name: 'Office', state: 'active', joining: false, lan: true }
    const { container, bridge } = await render({ capabilities: caps, exitNode: { exits, runs } }, { part: 'advanced' })
    expect(container.querySelector('[data-note="exit-lan"]')).not.toBeNull()
    bridge.status = { ...bridge.status, exitNode: { held: 'forbidden' } }
    await act(async () => bridge.emit('status', bridge.status))
    expect(state(container).getAttribute('data-exit-node-state')).toBe('held')
    expect(container.querySelector('[data-note="exit-lan"]')).toBeNull()
  })

  it('a list that says it runs no exit is believed, after a join on this page too', async () => {
    const { container, bridge } = await render({ capabilities: caps, exitNode: { exits, checks } }, { part: 'advanced' })
    await click(container.querySelector('[data-control="exit-choose"]'))
    await click(dialog()!.querySelector('[data-control="exit-go"]'))
    expect(state(container).getAttribute('data-exit-node-state')).toBe('failed')
    bridge.exitNode.runs = null
    const now = Date.now()
    const later = vi.spyOn(Date, 'now').mockReturnValue(now + 11000)
    try {
      await act(async () => document.dispatchEvent(new Event('visibilitychange')))
    } finally {
      later.mockRestore()
    }
    expect(state(container).getAttribute('data-exit-node-state')).toBe('off')
    expect(container.querySelector('[data-control="exit-check"]')).toBeNull()
  })

  it('a join is said from its answer, though the list after it fails', async () => {
    const { container, bridge } = await render({ capabilities: caps, exitNode: { exits, checks } }, { part: 'advanced' })
    const call = bridge.transport.call
    bridge.transport.call = (async (method: any, args: any) => {
      if (method === 'exitNode.list') throw new BridgeError('failed', 'the cloud did not answer')
      return call(method, args)
    }) as typeof call
    await click(container.querySelector('[data-control="exit-choose"]'))
    await click(dialog()!.querySelector('[data-control="exit-go"]'))
    expect(state(container).getAttribute('data-exit-node-state')).toBe('failed')
    expect(container.querySelector('[data-control="exit-check"]')).not.toBeNull()
  })

  it('the way to Advanced is there for either alone', async () => {
    const { container } = await render({ capabilities: ['status', 'ssh'] }, { part: 'settings' })
    expect(container.querySelector('[data-link="advanced"]')).not.toBeNull()
  })
})
