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
    expect(sections(container)).toEqual(['device', 'vpn', 'settings', 'diagnostics'])
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

  it('turns the VPN on and off through the bridge', async () => {
    const { container, bridge } = await render()
    const vpn = () => container.querySelector('[data-control="vpn"] input, input[data-control="vpn"]') as HTMLInputElement
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
    const { container, bridge } = await render()
    await act(async () =>
      bridge.emit('status', {
        ...bridge.status,
        vpn: { on: true },
        exit: { id: 'X', name: 'US West', kind: 'remoteit', state: 'connecting' },
      })
    )
    expect(container.querySelector('[data-vpn]')!.textContent).toContain('Connecting to US West')
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

  it('says to update the app when the shell’s bridge is another major version', async () => {
    const { container, bridge } = await render({ info: { bridgeVersion: '2.0.0' } })
    expect(container.textContent).toContain('Update the app')
    expect(sections(container)).toEqual([])
    expect(bridge.calls.map(c => c.method)).toEqual(['info'])
  })
})
