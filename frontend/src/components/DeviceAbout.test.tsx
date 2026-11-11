import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { read, devices, copies } = vi.hoisted(() => ({
  read: vi.fn(),
  devices: { current: [] as { id: string; name: string }[] },
  copies: { current: [] as { id: string; name: string }[] },
}))
vi.mock('../services/graphQLDeviceAbout', () => ({ graphQLDeviceAbout: read }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: () => null }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
// The devices the portal has read, and the copies awaiting a decision: what a history entry may link.
vi.mock('react-redux', () => ({ useSelector: (select: any) => select() }))
vi.mock('../selectors/devices', () => ({ getAllDevices: () => devices.current }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'A1' }))
vi.mock('../hooks/useDeviceIdentity', () => ({ useKnownCopies: () => copies.current }))
vi.mock('react-router-dom', () => ({
  Link: React.forwardRef(({ to, children, ...rest }: any, ref: any) => (
    <a ref={ref} href={to} {...rest}>
      {children}
    </a>
  )),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceAbout, changeLabel, changeText, fieldLabel, natLabel, otherDevice } from './DeviceAbout'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render(deviceId = 'A') {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<DeviceAbout deviceId={deviceId} />))
  return container
}

// This Mac, as it reported itself to the local stack.
const about = {
  os: {
    family: 'darwin',
    name: 'macOS',
    id: 'macos',
    version: '14.6',
    build: '23G80',
    kernel: '23.6.0',
    edition: null,
  },
  hardware: {
    arch: 'arm64',
    cpu: 'Apple M3 Pro',
    cores: 12,
    memoryMb: 36864,
    manufacturer: 'Apple',
    model: 'Mac15,6',
    board: null,
    virtual: 'none',
  },
  ids: {
    serial: 'H4WJD662TP',
    hardwareUuid: '7732bccc-5cac-5994-8ddc-206002d7e0fe',
    machineId: '7732bccc-5cac-5994-8ddc-206002d7e0fe',
    macs: [{ interface: 'en0', mac: '7c:f3:4d:da:f1:01' }],
    diskSerial: null,
  },
  oem: null,
  software: { connectd: 'connectd-go 5.6.1.20261001', package: '1.0.1', format: 'pkg' },
  data: { os: { family: 'darwin', name: 'macOS' }, hardware: { virtual: 'none' }, future: { thing: 1 } },
  reported: '2026-10-02T03:26:16Z',
  hardwareChanged: null,
}

describe('DeviceAbout', () => {
  it('shows System, Identifiers and Software, and the history, leaving out what the device did not say', async () => {
    read.mockResolvedValue({
      about,
      history: [
        { at: '2026-10-02T03:26:16Z', kind: 'field', field: 'software.package', before: '1.0.0', after: '1.0.1' },
        {
          at: '2026-10-02T03:00:00Z',
          kind: 'update',
          field: 'refused',
          before: null,
          after: '1.0.2',
          detail: 'unsigned',
        },
      ],
    })
    const text = (await render()).textContent
    expect(text).toContain('System')
    expect(text).toContain('macOS 14.6')
    expect(text).toContain('Apple M3 Pro, 12 cores')
    expect(text).toContain('36 GB')
    expect(text).toContain('H4WJD662TP')
    expect(text).toContain('en0 7c:f3:4d:da:f1:01')
    expect(text).toContain('1.0.1 (pkg)')
    expect(text).toContain('Package1.0.0 → 1.0.1')
    expect(text).toContain('Refused the upgrade to 1.0.2 — unsigned')
    expect(text).not.toContain('Machine ID') // the hardware UUID again
    expect(text).not.toContain('Virtual') // none
    expect(text).not.toContain('declared by the manufacturer') // no OEM product
    expect(text).not.toContain('other hardware')
    expect(text).not.toContain('NAT') // none from this API or device
  })

  it('shows the NAT the device measured itself behind, in plain words, or why it was not measured', async () => {
    const nat = {
      mapping: 'endpoint-dependent',
      filtering: 'address-and-port-dependent',
      since: '2026-10-07T15:00:00Z',
      note: null,
      why: null,
    }
    read.mockResolvedValue({ about: { ...about, nat }, history: [] })
    let text = (await render()).textContent
    expect(text).toContain('NAT:strict (address-and-port filtering, one port per destination) — since')
    read.mockResolvedValue({
      about: { ...about, nat: { ...nat, mapping: null, filtering: null, since: null, why: 'not IPv4' } },
      history: [],
    })
    text = (await render()).textContent
    expect(text).toContain('NAT:Not measured (not IPv4)')
  })

  it('warns when its serial or hardware ID changed', async () => {
    read.mockResolvedValue({ about: { ...about, hardwareChanged: '2026-10-01T12:00:00Z' }, history: [] })
    expect((await render()).querySelector('[data-notice]')?.textContent).toContain('other hardware')
  })

  it('shows the product its manufacturer declares', async () => {
    read.mockResolvedValue({
      about: {
        ...about,
        oem: {
          product: 'acme-gw',
          productName: 'Acme Gateway',
          model: 'GW-2',
          manufacturer: null,
          hardwareRevision: null,
          firmware: null,
          serial: null,
        },
      },
      history: [],
    })
    const text = (await render()).textContent
    expect(text).toContain('Product — declared by the manufacturer')
    expect(text).toContain('Acme Gateway (acme-gw)')
  })

  it('shows nothing where the API does not serve it, or the device said nothing', async () => {
    read.mockResolvedValue('UNSUPPORTED')
    expect((await render()).textContent).toBe('')
    read.mockResolvedValue({ about: null, history: [] })
    expect((await render()).textContent).toBe('')
  })

  it('shows the document exactly as the device said it, the fields the page leaves out too', async () => {
    read.mockResolvedValue({ about, history: [] })
    const container = await render()
    const button = [...container.querySelectorAll('button')].find(b => b.textContent === 'View details')!
    await act(async () => button.click())
    expect(JSON.parse(document.querySelector('[data-about-json]')!.textContent!)).toEqual(about.data)
  })
})

describe('history: restores, boots and duplicates', () => {
  const entry = (kind: string, field: string, before: string | null, after: string | null, detail: string | null) => ({
    at: '2026-11-09T10:00:00Z',
    kind,
    field,
    before,
    after,
    detail,
    generation: null,
  })

  it('reads each as what happened, not as a field that changed', async () => {
    read.mockResolvedValue({
      about: null,
      history: [
        entry('boot', 'boot', 'USB stick', 'Portland, OR', 'from 203.0.113.7'),
        entry('restore', 'restore', null, 'Seattle, WA', 'from 198.51.100.4'),
        entry('duplicate', 'copy', null, '80:00:00:00:00:00:00:09', 'from 203.0.113.8'),
        entry('duplicate', 'device-join-key', null, 'Austin, TX', 'from 192.0.2.1'),
      ],
    })
    const items = [...(await render()).querySelectorAll('li')].map(li => li.textContent).filter(t => t !== 'History')
    expect(items[0]).toContain('BootWith key USB stick, Portland, OR — from 203.0.113.7')
    expect(items[1]).toContain('RestoredSeattle, WA — from 198.51.100.4')
    expect(items[2]).toContain(
      'DuplicateA machine signed in as it, split off as 80:00:00:00:00:00:00:09 — from 203.0.113.8'
    )
    expect(items[3]).toContain(
      'DuplicateIts device join key in use on another machine, refused, Austin, TX — from 192.0.2.1'
    )
  })

  it('the other device an entry names links to its page, by its name, where the viewer can open it', async () => {
    devices.current = [{ id: 'X1', name: 'Pump' }]
    copies.current = [{ id: 'Y1', name: 'Pump (copy)' }]
    read.mockResolvedValue({
      about: null,
      history: [
        entry('duplicate', 'copy', null, 'Y1', 'from 203.0.113.8'),
        entry('duplicate', 'copy-of', null, 'X1', null),
        entry('duplicate', 'original', null, 'Z9', null),
        entry('duplicate', 'kept', null, 'X1', null),
        entry('boot', 'boot', 'USB stick', 'Portland, OR', null),
      ],
    })
    const page = await render()
    const items = [...page.querySelectorAll('li')].filter(li => li.textContent !== 'History')
    const link = (li: Element) => li.querySelector('a')
    expect(link(items[0])?.getAttribute('href')).toBe('/devices/Y1')
    expect(items[0].textContent).toContain('A machine signed in as it, split off as Pump (copy) — from 203.0.113.8')
    expect(link(items[1])?.getAttribute('href')).toBe('/devices/X1')
    expect(items[1].textContent).toContain('Split off from Pump: this machine signed in as it')
    // One this viewer cannot open: its ID, as before.
    expect(link(items[2])).toBeNull()
    expect(items[2].textContent).toContain('Its machine swapped with that of Z9')
    expect(link(items[3])?.getAttribute('href')).toBe('/devices/X1')
    expect(items[3].textContent).toContain('Kept as a device of its own, split off from Pump')
    // A boot names a key and a place, never another device.
    expect(link(items[4])).toBeNull()
    expect(otherDevice(entry('boot', 'boot', 'X1', 'X1', null) as any)).toBeUndefined()
    devices.current = []
    copies.current = []
  })

  it('every kind of duplicate entry', () => {
    const t = (_key: string, text: string, values?: any) =>
      text.replace(/{{(\w+)}}/g, (_: string, k: string) => values?.[k] ?? '')
    const text = (field: string, after: string | null = null) =>
      changeText(t as any, entry('duplicate', field, null, after, null) as any)
    expect(text('copy-of', 'X1')).toBe('Split off from X1: this machine signed in as it')
    expect(text('key')).toBe('Another machine with its identity, refused')
    expect(text('kept')).toBe('Kept as a device of its own')
    expect(text('kept', 'X1')).toBe('Kept as a device of its own, split off from X1')
    expect(text('original', 'Y1')).toBe('Its machine swapped with that of Y1')
    expect(text('something-new', 'Z')).toBe('something-new, Z')
    expect(changeLabel(t as any, entry('duplicate', 'kept', null, null, null) as any)).toBe('Duplicate')
    expect(changeText(t as any, entry('boot', 'boot', null, null, null) as any)).toBe('')
    expect(changeLabel(t as any, entry('field', 'os.version', '14', '15', null) as any)).toBe('OS version')
    expect(changeText(t as any, entry('field', 'os.version', null, '15', null) as any)).toBe('nothing → 15')
  })
})

describe('fieldLabel', () => {
  it('names a field as a person reads it, and leaves one it does not know as its path', () => {
    expect(fieldLabel('os.version')).toBe('OS version')
    expect(fieldLabel('ids.something_new')).toBe('ids.something_new')
  })
})

describe('natLabel', () => {
  const t = (_key: string, text: string) => text
  it('says a class in a word and what makes it so', () => {
    expect(natLabel(t as any, 'endpoint-independent', 'endpoint-independent')).toBe(
      'open (no filtering, one port for every destination)'
    )
    expect(natLabel(t as any, 'endpoint-independent', 'address-dependent')).toBe(
      'moderate (address filtering, one port for every destination)'
    )
    expect(natLabel(t as any, 'pool', 'address-and-port-dependent')).toBe(
      'strict (address-and-port filtering, a port per destination, over several addresses)'
    )
    expect(natLabel(t as any, 'something-new', 'something-new')).toBe('moderate')
  })
})
