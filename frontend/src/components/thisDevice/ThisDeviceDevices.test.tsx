import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { state, shortcuts, support, terminal, gateway, copy } = vi.hoisted(() => ({
  state: { current: {} as any },
  shortcuts: vi.fn(),
  support: vi.fn(),
  terminal: vi.fn(),
  gateway: vi.fn(async () => true),
  copy: vi.fn(),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))
vi.mock('react-redux', () => ({ useSelector: (select: (s: any) => any) => select(state.current) }))
vi.mock('../../selectors/accounts', () => ({ selectActiveAccountId: (s: any) => s.accountId }))
vi.mock('../../selectors/devices', () => ({
  selectVisibleDevices: (s: any) => s.devices,
  getDeviceModel: (s: any) => s.model,
}))
vi.mock('../../selectors/connections', () => ({ selectConnections: (s: any) => s.connections }))
vi.mock('../../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../../hooks/useServiceShortcutsSupport', () => ({ useServiceShortcutsSupport: () => support() }))
vi.mock('../../hooks/useLocalSubnetName', () => ({
  useLocalSubnetName: () => undefined,
  useSubnetName: (deviceId?: string) => (deviceId === 'NAS' ? 'nas-owner.on.solo.remote.it' : undefined),
}))
vi.mock('../../services/graphQLServiceShortcuts', () => ({ graphQLServiceShortcuts: shortcuts }))
vi.mock('../../services/browserGateway', () => ({ openThroughGateway: gateway }))
vi.mock('../../services/browser', () => ({ openServiceURL: vi.fn() }))
vi.mock('../../services/localSubnet', () => ({ subnetWebURL: (name: string, port: number) => `https://${name}:${port}` }))
vi.mock('../../helpers/terminalHelper', () => ({ openTerminal: terminal }))
vi.mock('../../hooks/useClipboard', () => ({ default: () => ({ copy, copied: false }) }))
vi.mock('@common/applications', async importOriginal => ({
  ...(await importOriginal<object>()),
  getApplicationType: (id: number) => ({ urlForm: id === 8 }),
}))

import { chooseDevices, ThisDeviceDevices } from './ThisDeviceDevices'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const device = (id: string, fields: Partial<IDevice> = {}) =>
  ({ id, name: id.toLowerCase(), state: 'active', services: [], ...fields } as IDevice)
const shortcut = (id: string, application: number, fields: any = {}) => ({
  id,
  name: id,
  state: 'active',
  enabled: true,
  application,
  subnetName: `${id.toLowerCase()}.on.solo.remote.it`,
  subnetPort: 443,
  device: { id: 'PI', name: 'pi' },
  ...fields,
})
const THIS = 'MAC'

async function render() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<ThisDeviceDevices uid={THIS} />))
  await act(async () => {})
  return container
}
const rows = (c: HTMLElement) =>
  [...c.querySelectorAll('[data-device-row]')].map(row => [
    row.getAttribute('data-device-row'),
    row.querySelector('[data-action]')?.getAttribute('data-action') ?? null,
  ])

beforeEach(() => {
  support.mockReset().mockReturnValue({ available: true, namedAddress: true })
  shortcuts.mockReset().mockResolvedValue([])
  terminal.mockReset()
  gateway.mockClear()
  copy.mockReset()
  state.current = {
    accountId: 'ME',
    model: { initialized: true, fetching: false },
    devices: [],
    connections: [],
    applicationTypes: { all: [] },
  }
})

describe('Your devices, signed in', () => {
  it('shortcuts first, then devices by their latest connection, then online ones; this machine left out', async () => {
    shortcuts.mockResolvedValue([shortcut('Grafana', 8), shortcut('Shell', 28)])
    state.current.devices = [
      device(THIS),
      device('ZED'),
      device('NAS'),
      device('OLD', { state: 'inactive' }),
      device('USED', { state: 'inactive' }),
    ]
    state.current.connections = [{ id: 'c', deviceID: 'USED', enabled: false, startTime: 100 }]
    const c = await render()
    expect(shortcuts).toHaveBeenCalledWith('ME', true)
    expect(rows(c)).toEqual([
      ['Grafana', 'open'],
      ['Shell', 'terminal'],
      ['USED', 'device'],
      ['NAS', 'copy'],
      ['ZED', 'device'],
    ])
    // OLD is offline and never used: left for the Devices page.
    expect(c.querySelector('[data-link="devices"]')!.textContent).toBe('All devices (1 more)')
    expect(c.querySelector('[data-link="devices"]')!.getAttribute('href')).toBe('#/devices')
  })

  it('each row’s one action: open a web service, open a terminal, copy an address', async () => {
    shortcuts.mockResolvedValue([shortcut('Grafana', 8), shortcut('Shell', 28, { subnetPort: 2222 })])
    state.current.devices = [device('NAS')]
    const c = await render()
    await act(async () => (c.querySelector('[data-device-row="Grafana"] [data-action]') as HTMLElement).click())
    expect(gateway).toHaveBeenCalledWith('grafana.on.solo.remote.it')
    await act(async () => (c.querySelector('[data-device-row="Shell"] [data-action]') as HTMLElement).click())
    expect(terminal).toHaveBeenCalledWith({ name: 'shell.on.solo.remote.it', port: 2222, title: 'Shell', service: 'Shell' })
    await act(async () => (c.querySelector('[data-device-row="NAS"] [data-action]') as HTMLElement).click())
    expect(copy).toHaveBeenCalledWith('nas-owner.on.solo.remote.it')
  })

  it('an offline service says so, with nothing to do from here', async () => {
    shortcuts.mockResolvedValue([shortcut('Grafana', 8, { state: 'inactive' })])
    const c = await render()
    expect(rows(c)).toEqual([['Grafana', null]])
    expect(c.textContent).toContain('pi · Offline')
  })

  it('no shortcuts where the API has none: devices alone', async () => {
    support.mockReturnValue({ available: false, namedAddress: false })
    state.current.devices = [device('NAS')]
    const c = await render()
    expect(shortcuts).not.toHaveBeenCalled()
    expect(rows(c)).toEqual([['NAS', 'copy']])
    expect(c.querySelector('[data-link="devices"]')!.textContent).toBe('All devices')
  })

  it('capped, the rest on the Devices page', async () => {
    state.current.devices = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(id => device(id))
    const c = await render()
    expect(rows(c).length).toBe(5)
    expect(c.querySelector('[data-link="devices"]')!.textContent).toBe('All devices (2 more)')
  })

  it('nothing else to reach: the way to add a device', async () => {
    state.current.devices = [device(THIS)]
    const c = await render()
    expect(c.querySelector('[data-devices="none"]')).not.toBeNull()
    expect(c.querySelector('[data-link="add-device"]')!.getAttribute('href')).toBe('#/add')
  })

  it('waits for the device list', async () => {
    state.current.model = { initialized: false, fetching: true }
    const c = await render()
    expect(c.querySelector('[data-devices="loading"]')).not.toBeNull()
  })
})

describe('chooseDevices', () => {
  it('leaves out devices a shortcut already stands for, and this machine’s own shortcuts', () => {
    const pi = device('PI')
    const own = shortcut('Here', 8, { device: { id: THIS, name: 'mac' } })
    const { shown, more } = chooseDevices([shortcut('Grafana', 8), own] as any, [pi, device(THIS)], [], THIS)
    expect(shown.map(c => (c.kind === 'service' ? c.service.id : c.device.id))).toEqual(['Grafana'])
    expect(more).toBe(0)
  })
})
