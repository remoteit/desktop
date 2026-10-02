import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { read } = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('../services/graphQLDeviceAbout', () => ({ graphQLDeviceAbout: read }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceAbout } from './DeviceAbout'
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
})
