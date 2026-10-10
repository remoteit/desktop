import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))
vi.mock('../components/Container', () => ({ Container: ({ children }: any) => <div>{children}</div> }))
vi.mock('../hooks/useThisDevice', () => ({ useThisDevice: () => null }))
vi.mock('../components/ThisDeviceSignIn', () => ({ ThisDeviceSignIn: () => null }))

import { ThisDeviceView } from './ThisDevicePage'
import { ThisDevice, Capability } from '../services/thisDevice'
import { createMockBridge, MockBridgeOptions } from '../services/thisDeviceMock'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// "This device" draws itself from the bridge's capabilities alone (device-package docs/one-app-plan.md), against a
// mock shell: what a capability is not offered for never shows, and the platform changes nothing.

async function render(options: MockBridgeOptions = {}, props: { signedIn?: boolean } = {}) {
  const bridge = createMockBridge(options)
  const info = await bridge.transport.call('info', {})
  const device = new ThisDevice(bridge.transport, info)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<ThisDeviceView device={device} {...props} />))
  await act(async () => {}) // the first status, exits and settings
  return { container, bridge, root }
}
const sections = (c: HTMLElement) => [...c.querySelectorAll('[data-section]')].map(e => e.getAttribute('data-section'))

describe('This device', () => {
  it('shows what the desktop menu offers, and nothing it does not', async () => {
    const { container } = await render()
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'settings', 'diagnostics'])
    expect(container.textContent).toContain('Mock MacBook')
    expect(container.textContent).toContain('mockmacbook.on.solo.remote.it')
  })

  it('shows a phone’s permissions where the shell offers them', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings', 'permissions', 'diagnostics', 'auth']
    const { container } = await render({ capabilities: caps, info: { platform: 'ios', shell: 'capacitor' } })
    expect(sections(container)).toEqual(['device', 'vpn', 'settings', 'permissions', 'diagnostics'])
  })

  it('draws the same page for the same capabilities on any platform', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings']
    const mac = await render({ capabilities: caps, info: { platform: 'mac', shell: 'menu' } })
    const ios = await render({ capabilities: caps, info: { platform: 'ios', shell: 'capacitor' } })
    const html = (c: HTMLElement) => c.innerHTML.replace(/:r[0-9a-z]+:/g, ':id:') // React's generated ids differ
    expect(html(ios.container)).toEqual(html(mac.container))
  })

  it('shows only the device where the shell offers only its status', async () => {
    const { container } = await render({ capabilities: ['status'] })
    expect(sections(container)).toEqual(['device'])
  })

  it('turns the VPN on and off through the bridge, from a shell before Access and Protect', async () => {
    const caps: Capability[] = ['status', 'vpn', 'exit', 'settings', 'diagnostics']
    const { container, bridge } = await render({ capabilities: caps, route: '80:00:00:00:01:0B:00:01' })
    expect(sections(container)).toEqual(['device', 'vpn', 'settings', 'diagnostics'])
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
    expect(line('protect').textContent).toContain('Send all of this Mac’s internet traffic through a device you choose')

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

  it('sets a setting by its connectd name, and leaves a locked one alone', async () => {
    const { container, bridge } = await render()
    const printers = container.querySelector('[data-setting="printers"] input') as HTMLInputElement
    expect(printers.checked).toBe(true)
    await act(async () => printers.click())
    expect(bridge.calls.find(c => c.method === 'settings.set')!.args).toEqual({ name: 'printers', value: false })
    expect((container.querySelector('[data-setting="printers"] input') as HTMLInputElement).checked).toBe(false)
    const relay = container.querySelector('[data-setting="websocket"] input') as HTMLInputElement
    expect(relay.disabled).toBe(true)
    expect(container.querySelector('[data-setting="websocket"]')!.textContent).toContain('administrator')
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
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'services', 'diagnostics'])
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
    const { container, bridge } = await render({
      settings: [
        { name: 'services', value: true, source: 'default' },
        { name: 'lan_services', value: false, source: 'default' },
      ],
    })
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
  const phone = (options: MockBridgeOptions = {}) =>
    render({
      capabilities: PHONE,
      info: { platform: 'ios', shell: 'capacitor', deviceKind: 'iPhone' },
      settings: [{ name: 'services', value: false, source: 'default' }],
      ...options,
    })

  it('a phone: the switch after Access and Protect, in place of its setting, in a phone’s words', async () => {
    const { container } = await phone()
    // services was the phone's only setting: shown as the switch, no Settings section is left.
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'services', 'permissions', 'diagnostics'])
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
    expect(container.querySelector('[data-section="permissions"]')!.textContent).toContain('Local networkgranted')

    await act(async () =>
      bridge.emit('status', {
        ...bridge.status,
        served: [
          { service: 'S1', target: '192.168.1.1:80', sessions: 2 },
          { service: 'S2', target: '192.168.1.50:554', sessions: 0, lastError: 'no route to host' },
        ],
      })
    )
    const served = [...container.querySelectorAll('[data-served]')].map(e => e.textContent)
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
    expect(container.querySelectorAll('[data-served]').length).toBe(0)
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
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'settings', 'diagnostics'])
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

  it('the device’s details, and its removal asked of the shell', async () => {
    const { container, bridge } = await render({ capabilities: caps, status, settings })
    const text = (sel: string) => container.querySelector(sel)?.textContent
    expect(text('[data-detail="owner"]')).toContain('owner@example.com')
    expect(text('[data-detail="address"]')).toContain('198.18.16.12')
    expect(text('[data-detail="uid"]')).toContain('80:00:00:00:01:0A:BC:DE')
    expect(text('[data-detail="versions"]')).toBe('VersionsPackage 1.1.0.20261010 · connectd 5.6.1.20261010')
    expect(text('[data-engine]')).toContain('Online since')
    const remove = container.querySelector('[data-control="remove"]') as HTMLButtonElement
    expect(remove.textContent).toBe('Remove from this Mac…')
    await act(async () => remove.click())
    expect(bridge.calls.filter(c => c.method === 'device.remove')).toHaveLength(1)
    expect(container.textContent).not.toContain('Removed from this Mac') // the person said no
  })

  it('the machine’s only one: Uninstall', async () => {
    const { container } = await render({
      capabilities: caps,
      status: { ...status, device: { ...status.device, removal: 'uninstall' } },
      settings,
    })
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
    const { container } = await render({ capabilities: caps, status, settings })
    const row = (name: string) => container.querySelector(`[data-section="settings"] [data-setting="${name}"]`)!
    expect(row('exit_node').textContent).toContain('Turned off by this machine’s administrator')
    expect((row('exit_node').querySelector('input') as HTMLInputElement).disabled).toBe(true)
    expect(row('console').textContent).toContain('Not served: remote access to services is off')
    expect(row('websocket').textContent).toContain('Changed from the portal to Always')
    expect(row('websocket').textContent).toContain('In use now')
    expect(row('websocket').textContent).toContain('Automatic')
  })

  it('the detailed connection logging, and the app’s own Open at login', async () => {
    const { container, bridge } = await render({
      capabilities: caps,
      status,
      settings,
      app: { openAtLogin: { on: true } },
    })
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
    const { container } = await render({
      capabilities: ['status', 'settings', 'access', 'protect', 'services'],
      settings,
    })
    expect(container.querySelector('[data-section="logging"]')).toBeNull()
    expect(container.querySelector('[data-section="app"]')).toBeNull()
    expect(container.querySelector('[data-control="remove"]')).toBeNull()
  })
})
