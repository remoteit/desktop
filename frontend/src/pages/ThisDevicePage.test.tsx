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

import { ThisDeviceView } from './ThisDevicePage'
import { ThisDevice, Capability } from '../services/thisDevice'
import { createMockBridge, MockBridgeOptions } from '../services/thisDeviceMock'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// "This device" draws itself from the bridge's capabilities alone (device-package docs/one-app-plan.md), against a
// mock shell: what a capability is not offered for never shows, and the platform changes nothing.

async function render(options: MockBridgeOptions = {}) {
  const bridge = createMockBridge(options)
  const info = await bridge.transport.call('info', {})
  const device = new ThisDevice(bridge.transport, info)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<ThisDeviceView device={device} />))
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

  it('never lists lan_services among the settings where no shell offers its switch (a desktop serves its services whatever it says)', async () => {
    const { container } = await render({
      settings: [
        { name: 'lan_services', value: false, source: 'default' },
        { name: 'printers', value: true, source: 'machine' },
      ],
    })
    expect(sections(container)).not.toContain('lanServices')
    expect(container.querySelector('[data-setting="lan_services"]')).toBeNull()
    expect(container.querySelector('[data-setting="printers"]')).not.toBeNull()
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
  ]
  const phone = (options: MockBridgeOptions = {}) =>
    render({
      capabilities: PHONE,
      info: { platform: 'ios', shell: 'capacitor', deviceKind: 'iPhone' },
      settings: [{ name: 'lan_services', value: false, source: 'default' }],
      ...options,
    })

  it('shows the third switch after Access and Protect, in place of its setting', async () => {
    const { container } = await phone()
    // lan_services was the phone's only setting: shown as the switch, no Settings section is left.
    expect(sections(container)).toEqual(['device', 'access', 'protect', 'lanServices', 'permissions', 'diagnostics'])
    expect(container.querySelector('[data-setting="lan_services"]')).toBeNull()
    const line = container.querySelector('[data-lan-services]')!
    expect(line.getAttribute('data-lan-services')).toBe('off')
    expect(line.textContent).toBe(
      'Allow remote access to services on the networkPeople you share with can reach devices on the network this iPhone is on, through it.'
    )
  })

  it('turns it on through lanServices.set, the Local Network permission asked then, and lists what it serves', async () => {
    const { container, bridge } = await phone()
    const control = () => container.querySelector('[data-control="lanServices"] input') as HTMLInputElement
    await act(async () => control().click())
    expect(bridge.calls.filter(c => c.method === 'lanServices.set').map(c => c.args)).toEqual([{ on: true }])
    expect(bridge.calls.filter(c => c.method === 'settings.set')).toEqual([])
    expect(container.querySelector('[data-lan-services]')!.getAttribute('data-lan-services')).toBe('on')
    expect(bridge.status.lanServices?.localNetworkPermission).toBe('granted')
    expect(container.querySelectorAll('[data-lan-services-state]').length).toBe(0)
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
    expect(bridge.calls.filter(c => c.method === 'lanServices.set').map(c => c.args)).toEqual([{ on: true }, { on: false }])
    expect(container.querySelector('[data-lan-services]')!.getAttribute('data-lan-services')).toBe('off')
    expect(container.querySelectorAll('[data-served]').length).toBe(0)
  })

  it('says what keeps its services from being reached: the permission refused, no local network', async () => {
    const { container, bridge } = await phone({ localNetworkPermission: 'denied', onLocalNetwork: false })
    await act(async () => (container.querySelector('[data-control="lanServices"] input') as HTMLInputElement).click())
    const states = [...container.querySelectorAll('[data-lan-services-state]')].map(e => [
      e.getAttribute('data-lan-services-state'),
      e.textContent,
    ])
    expect(states).toEqual([
      ['permission', 'Needs Local Network access: turn on Local Network for remote.it in this iPhone’s Settings.'],
      ['network', 'Not on a local network: this iPhone is on cellular or offline, so its services can’t be reached.'],
    ])
    expect(bridge.status.lanServices?.on).toBe(true)
  })

  it('offers to ask for the Local Network permission when it was turned on from elsewhere', async () => {
    const { container, bridge } = await phone({
      settings: [{ name: 'lan_services', value: true, source: 'cloud' }],
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
      settings: [{ name: 'lan_services', value: false, source: 'machine', locked: true }],
    })
    expect((container.querySelector('[data-control="lanServices"] input') as HTMLInputElement).disabled).toBe(true)
    expect(container.querySelector('[data-lan-services]')!.textContent).toContain('administrator')
  })

  it('says to update the app when the shell’s bridge is another major version', async () => {
    const { container, bridge } = await render({ info: { bridgeVersion: '2.0.0' } })
    expect(container.textContent).toContain('Update the app')
    expect(sections(container)).toEqual([])
    expect(bridge.calls.map(c => c.method)).toEqual(['info'])
  })
})
