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
const { usage } = vi.hoisted(() => ({ usage: vi.fn() }))
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

describe('This device', () => {
  it('shows what the desktop menu offers, and nothing it does not', async () => {
    const { container, bridge } = await render()
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'more'])
    expect(container.textContent).toContain('Mock MacBook')
    expect(container.textContent).toContain('mockmacbook.on.solo.remote.it')
    const advanced = await mount(bridge, { part: 'advanced' })
    expect(sections(advanced.container)).toEqual(['settings', 'diagnostics'])
  })

  it('the page leads to Details and Advanced, and to its page in remote.it signed in', async () => {
    const { container } = await render()
    const links = [...container.querySelectorAll('[data-link]')].map(a => [a.getAttribute('data-link'), a.getAttribute('href')])
    expect(links).toEqual([
      ['details', '#/this-device/details'],
      ['advanced', '#/this-device/advanced'],
      ['device-page', '#/devices/80:00:00:00:01:0A:BC:DE'],
    ])
  })

  it('no Advanced where there is nothing for it', async () => {
    const { container } = await render({ capabilities: ['status'] })
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
    expect(sections(container)).toEqual(['device', 'vpn', 'more'])
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

  it('turns the VPN on and off through the bridge, from a shell before Access and Protect', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings', 'diagnostics']
    const { container, bridge } = await render({ capabilities: caps, route: '80:00:00:00:01:0B:00:01' })
    expect(sections(container)).toEqual(['device', 'vpn', 'more'])
    const vpn = () =>
      container.querySelector('[data-control="vpn"] input, input[data-control="vpn"]') as HTMLInputElement
    const line = () => container.querySelector('[data-vpn]')!
    expect(line().getAttribute('data-vpn')).toBe('off')
    await act(async () => vpn().click())
    expect(bridge.calls.filter(c => c.method === 'vpn.set').map(c => c.args)).toEqual([{ on: true }])
    expect(line().getAttribute('data-vpn')).toBe('on')
    expect(line().textContent).toContain('Connected through Office')
    await act(async () => vpn().click())
    expect(bridge.calls.filter(c => c.method === 'vpn.set').map(c => c.args)).toEqual([{ on: true }, { on: false }])
    expect(line().getAttribute('data-vpn')).toBe('off')
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
    expect(container.querySelector('[data-vpn]')!.textContent).toContain('Connecting to US West')
  })

  it('turns Access and Protect on and off apart, Protect back on through the same exit', async () => {
    const { container, bridge } = await render()
    const control = (name: string) =>
      container.querySelector(`[data-control="${name}"] input, input[data-control="${name}"]`) as HTMLInputElement
    const line = (name: string) => container.querySelector(`[data-${name}]`)!
    const calls = (method: string) => bridge.calls.filter(c => c.method === method).map(c => c.args)
    expect(line('access').getAttribute('data-access')).toBe('on')
    expect(line('access').textContent).toContain('This Mac is mockmacbook.on.solo.remote.it')
    expect(line('protect').getAttribute('data-protect')).toBe('off')
    // No exit chosen yet, two to choose from: Protect waits for Route through.
    expect(control('protect').disabled).toBe(true)
    expect(line('protect').textContent).toContain('Send all of this Mac’s internet traffic through an exit you choose')

    // Route through, chosen while Protect is off: kept, nothing turned on; the subtitle names it.
    await act(async () => {
      const input = control('route')
      // MUI's select: its hidden input takes the value; a change event is what the menu's click sends.
      const props = Object.keys(input).find(k => k.startsWith('__reactProps'))!
      ;(input as any)[props].onChange({ target: { value: '80:00:00:00:01:0B:00:03' } })
    })
    expect(calls('protect.route')).toEqual([{ id: '80:00:00:00:01:0B:00:03' }])
    expect(line('protect').getAttribute('data-protect')).toBe('off')
    expect(line('protect').textContent).toBe(
      'remote.it ProtectAll traffic from this Mac goes through US West. If US West can’t be reached, traffic stops rather than going out unprotected.'
    )
    await act(async () => control('protect').click())
    expect(calls('protect.set')).toEqual([{ on: true }])
    expect(bridge.status.exit?.id).toBe('80:00:00:00:01:0B:00:03')
    expect(line('protect').getAttribute('data-protect')).toBe('on')

    // Access off leaves Protect on; Protect off and on again goes through the same exit.
    await act(async () => control('access').click())
    expect(calls('access.set')).toEqual([{ on: false }])
    expect(line('access').getAttribute('data-access')).toBe('off')
    expect(line('protect').getAttribute('data-protect')).toBe('on')
    await act(async () => control('protect').click())
    expect(bridge.status.exit).toBeUndefined()
    expect(line('protect').textContent).toContain('goes through US West')
    await act(async () => control('protect').click())
    expect(calls('protect.set')).toEqual([{ on: true }, { on: false }, { on: true }])
    expect(bridge.status.exit?.id).toBe('80:00:00:00:01:0B:00:03')
    expect(calls('vpn.set')).toEqual([])
    expect(calls('exit.set')).toEqual([])
  })

  it('says when traffic goes out the usual way while the exit cannot be reached', async () => {
    const { container } = await render({ route: '80:00:00:00:01:0B:00:01', killSwitch: false })
    expect(container.querySelector('[data-protect]')!.textContent).toContain(
      'If Office can’t be reached, traffic goes out the usual way meanwhile.'
    )
  })

  it('Route through: always shown, the device chosen in it, Protect on or off — no Change device', async () => {
    const route = (c: HTMLElement) => c.querySelector('input[data-control="route"], [data-control="route"] input') as HTMLInputElement
    for (const options of [{}, { route: '80:00:00:00:01:0B:00:01' }, { route: '80:00:00:00:01:0B:00:01', status: { vpn: { on: true } } as any }]) {
      const { container } = await render(options)
      expect(route(container)).not.toBeNull()
      expect(route(container).value).toBe(options.route ?? '')
      expect(container.querySelector('[data-control="changeRoute"]')).toBeNull()
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
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'services', 'more'])
    expect(sections((await mount(bridge, { part: 'advanced' })).container)).toEqual(['diagnostics'])
    expect(container.querySelector('[data-section="access"] [data-setting="printers"]')).not.toBeNull()
    expect(container.querySelector('[data-setting="services"]')).toBeNull()
    expect(container.querySelector('[data-setting="lan_services"]')).toBeNull()
    const line = container.querySelector('[data-services]')!
    expect(line.getAttribute('data-services')).toBe('on')
    expect(line.textContent).toBe('Allow remote access to servicesPeople you share with can reach this Mac’s services.')
    await act(async () => (container.querySelector('[data-control="services"] input') as HTMLInputElement).click())
    expect(bridge.calls.filter(c => c.method === 'services.set').map(c => c.args)).toEqual([{ on: false }])
    expect(bridge.calls.filter(c => c.method === 'permissions.request' || c.method === 'permissions.get')).toEqual([])
    expect(container.querySelector('[data-services]')!.getAttribute('data-services')).toBe('off')
    expect(container.querySelectorAll('[data-services-state]').length).toBe(0)
    expect(container.textContent).not.toContain('No services on this')
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
    expect(row.textContent).toContain('Allow remote access to services')
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
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'services', 'more'])
    expect(sections((await phone({}, 'advanced')).container)).toEqual(['permissions', 'diagnostics'])
    expect(container.querySelector('[data-setting="services"]')).toBeNull()
    const line = container.querySelector('[data-services]')!
    expect(line.getAttribute('data-services')).toBe('off')
    expect(line.textContent).toBe(
      'Allow remote access to servicesPeople you share with can reach devices on the network this iPhone is on, through it.'
    )
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
    expect(container.textContent).toContain('No services on this iPhone yet')
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
    expect(summary.textContent).toBe('2 services · 2 connections — see them in Details')
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
      ['permission', 'Needs Local Network access: turn on Local Network for remote.it in this iPhone’s Settings.'],
      ['network', 'Not on a local network: this iPhone is on cellular or offline, so its services can’t be reached.'],
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
    expect(container.querySelector('[data-services]')!.textContent).toContain('administrator')
  })

  it('works signed out: every switch through the bridge, nothing of the account’s', async () => {
    const signedIn = await render()
    expect(signedIn.container.textContent).toContain('Its page in remote.it')
    const { container, bridge } = await render({}, { signedIn: false })
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'more'])
    expect(container.textContent).toContain('Mock MacBook')
    expect(container.textContent).not.toContain('Its page in remote.it')
    expect(container.querySelector('a[href^="#/devices/"]')).toBeNull()
    const control = (name: string) => container.querySelector(`[data-control="${name}"] input`) as HTMLInputElement
    await act(async () => control('access').click())
    expect(container.querySelector('[data-access]')!.getAttribute('data-access')).toBe('off')
    await act(async () => {
      const input = control('route') ?? (container.querySelector('input[data-control="route"]') as HTMLInputElement)
      const props = Object.keys(input).find(k => k.startsWith('__reactProps'))!
      ;(input as any)[props].onChange({ target: { value: '80:00:00:00:01:0B:00:01' } })
    })
    await act(async () => control('protect').click())
    expect(container.querySelector('[data-protect]')!.getAttribute('data-protect')).toBe('on')
    expect(bridge.calls.map(c => c.method).filter(m => /\.(set|route)$/.test(m))).toEqual([
      'access.set',
      'protect.route',
      'protect.set',
    ])
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
    { name: 'console', value: true, source: 'cloud' as const },
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
    expect(text('[data-detail="versions"]')).toBe('VersionsPackage 1.1.0.20261010 · connectd 5.6.1.20261010')
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
    expect(container.querySelector('[data-control="remove"]')!.textContent).toBe('Uninstall remote.it from this Mac…')
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
      'Moved to 198.18.16.0/20: another network took 198.18.0.0/20'
    )
    expect(access.querySelector('[data-setting="printers"]')!.textContent).toContain('Show remote printers on this Mac')
    expect(container.querySelector('[data-section="settings"] [data-setting="printers"]')).toBeNull()
  })

  it('what the device offers: reasons, a change replaced, the relay in use, and what is not served', async () => {
    const { container } = await render({ capabilities: caps, status, settings }, { part: 'advanced' })
    const row = (name: string) => container.querySelector(`[data-section="settings"] [data-setting="${name}"]`)!
    expect(row('exit_node').textContent).toContain('Turned off by this machine’s administrator')
    expect((row('exit_node').querySelector('input') as HTMLInputElement).disabled).toBe(true)
    expect(row('console').textContent).toContain('Not served: remote access to services is off')
    expect(row('websocket').textContent).toContain('Changed from the portal to Always')
    expect(row('websocket').textContent).toContain('In use now')
    expect(row('websocket').textContent).toContain('Automatic')
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
      'Not runningThis Mac is offline — no one can reach its services, and Protect and Access are off'
    )
    const access = container.querySelector(
      '[data-control="access"] input, input[data-control="access"]'
    ) as HTMLInputElement
    expect(access.disabled).toBe(true)
    const start = container.querySelector('[data-control="start"]') as HTMLButtonElement
    expect(start.textContent).toBe('Start remote.it')
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
      'OffTurn on Access, Protect or remote access to services to start it'
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
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'more'])
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
    const hint = (c: HTMLElement) => c.querySelector('[data-section="protect"] [data-testid="transfer-usage-hint"]')

    it.each([
      ['with an allowance', exit(), '8.2 of 10 GB this month'],
      ['over it', exit({ usedBytes: 12e9, over: true }), `Slowed to 5 Mbit/s until ${resets}`],
      ['with no allowance', exit({ allowanceBytes: null }), '8.2 GB this month'],
    ])('routed through remote.it’s exit, %s', async (_, row, text) => {
      usage.mockReset().mockResolvedValue([row])
      const { container } = await render({ route: US_WEST }, { renderExitUsage })
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
      await act(async () => {
        const input = container.querySelector('input[data-control="route"]') as HTMLInputElement
        const props = Object.keys(input).find(k => k.startsWith('__reactProps'))!
        ;(input as any)[props].onChange({ target: { value: US_WEST } })
      })
      await act(async () => {})
      expect(usage).toHaveBeenCalledTimes(1)
      expect(hint(container)!.textContent).toBe('8.2 of 10 GB this month')
    })

    it('nothing where the usage cannot be read, and the page stands', async () => {
      usage.mockReset().mockResolvedValue('ERROR')
      const { container } = await render({ route: US_WEST }, { renderExitUsage })
      expect(hint(container)).toBeNull()
      expect(sections(container)).toEqual(['device', 'access', 'protect', 'more'])
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
      const line = () => container.querySelector('[data-section="vpn"] [data-testid="transfer-usage-hint"]')
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
  const note = (c: HTMLElement, id: string) => c.querySelector(`[data-note="${id}"]`)?.textContent ?? null

  it('each exit with its devices counted where the page reads them, for this device; the engine’s list alone without', async () => {
    const readExits = reader(cloud())
    const { container } = await render({}, { readExits })
    expect(readExits).toHaveBeenCalledWith(MACHINE)
    expect(await listed(container, 'route')).toEqual([
      ['Office', '1 of 2 devices carrying traffic'],
      ['US West (remote.it)', '2 devices'],
    ])
    // The field shows the exit's name alone; the placeholder names what is chosen.
    expect(container.querySelector('[data-section="protect"] [role="combobox"]')!.textContent).toBe('Choose an exit')

    const signedOut = await render()
    expect(await listed(signedOut.container, 'route')).toEqual([
      ['Office', null],
      ['US West (remote.it)', null],
    ])
    expect(note(signedOut.container, 'protect.through')).toBeNull()
  })

  it('the device of the exit in use, while Protect is on through it; read again as the route or Protect moves', async () => {
    const readExits = reader(cloud({ id: US_WEST, through: { id: 'E2', name: 'e2' }, serving: two }))
    const on = await render({ route: US_WEST, status: { vpn: { on: true } } as any }, { readExits })
    expect(note(on.container, 'protect.through')).toBe('Going out through e2 now · one of 2 devices')
    expect(on.container.querySelector('[data-section="protect"] [role="combobox"]')!.textContent).toBe('US West (remote.it)')

    // Protect off: nothing goes through it now.
    const off = await render({ route: US_WEST }, { readExits })
    expect(note(off.container, 'protect.through')).toBeNull()
    const asked = readExits.mock.calls.length
    await act(async () => control(off.container, 'protect').click())
    await act(async () => {})
    expect(readExits.mock.calls.length).toBeGreaterThan(asked)
    expect(note(off.container, 'protect.through')).toBe('Going out through e2 now · one of 2 devices')

    // The account says another exit is in use than the one chosen here: not said of this one.
    const other = await render(
      { route: OFFICE, status: { vpn: { on: true } } as any },
      { readExits: reader(cloud({ id: US_WEST, through: { id: 'E2', name: 'e2' }, serving: two })) }
    )
    expect(note(other.container, 'protect.through')).toBeNull()
  })

  it('who may not choose the machine’s exit here: read-only, with why; Protect off stays theirs', async () => {
    const chooseRefusal = 'Only someone who manages this device chooses its exit'
    const off = await render({ route: US_WEST, chooseRefusal }, { readExits: reader(cloud()) })
    expect(control(off.container, 'route').closest('.MuiInputBase-root')!.classList.contains('Mui-disabled')).toBe(true)
    expect(control(off.container, 'protect').disabled).toBe(true)
    expect(note(off.container, 'protect.choose')).toBe(chooseRefusal)

    const on = await render({ route: US_WEST, chooseRefusal, status: { vpn: { on: true } } as any })
    expect(control(on.container, 'protect').disabled).toBe(false)
    await act(async () => control(on.container, 'protect').click())
    expect(on.bridge.calls.filter(c => c.method === 'protect.set').map(c => c.args)).toEqual([{ on: false }])
    expect(on.container.querySelector('[data-protect]')!.getAttribute('data-protect')).toBe('off')
    // Off, it is not turned on again here.
    expect(control(on.container, 'protect').disabled).toBe(true)

    // A shell before 1.10.0 says nothing: the choice is offered, and the shell's refusal shown when it comes.
    const before = await render({ route: US_WEST })
    expect(control(before.container, 'protect').disabled).toBe(false)
    expect(note(before.container, 'protect.choose')).toBeNull()
  })

  it('remote.it’s exit said so once, where its name says so already', async () => {
    const exits = [
      { id: 'pdx1a', name: 'remote.it pdx1a', kind: 'remoteit' as const },
      { id: US_WEST, name: 'US West', kind: 'remoteit' as const },
    ]
    const { container } = await render({ exits })
    expect((await listed(container, 'route')).map(([name]) => name)).toEqual(['remote.it pdx1a', 'US West (remote.it)'])
  })

  it('a shell before Protect: its exit picker the same, and the device in use under it', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings']
    const status = { vpn: { on: true }, exit: { id: US_WEST, name: 'US West', kind: 'remoteit', state: 'up' } } as any
    const { container } = await render(
      { capabilities: caps, status },
      { readExits: reader(cloud({ id: US_WEST, through: { id: 'E1', name: 'e1' }, serving: two })) }
    )
    expect(await listed(container, 'exit')).toEqual([
      ['Office', '1 of 2 devices carrying traffic'],
      ['US West (remote.it)', '2 devices'],
    ])
    expect(note(container, 'exit.through')).toBe('Going out through e1 now · one of 2 devices')
  })
})
