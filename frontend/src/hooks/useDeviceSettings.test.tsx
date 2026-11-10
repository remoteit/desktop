import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { read } = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('../services/graphQLDeviceSettings', () => ({ graphQLDeviceSettings: read, graphQLSetDeviceSetting: vi.fn() }))
vi.mock('./useDeviceSessions', () => ({ useDeviceSessions: () => true }))

import { refreshDeviceSettings, useDeviceSettings } from './useDeviceSettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
const seen: Record<string, any> = {}
const Settings = ({ deviceId, name }: { deviceId: string; name: string }) => {
  seen[name] = useDeviceSettings(deviceId).settings
  return null
}

beforeEach(() => {
  read.mockReset().mockResolvedValue([{ name: 'subnet', value: false }])
})
afterEach(() => act(() => root.unmount()))

describe('a device’s settings, read again when graphql changed them by something else', () => {
  it('every part showing that device’s reads them again; another device’s does not', async () => {
    root = createRoot(document.createElement('div'))
    await act(async () =>
      root.render(
        <>
          <Settings deviceId="D1" name="a" />
          <Settings deviceId="D1" name="b" />
          <Settings deviceId="D2" name="c" />
        </>
      )
    )
    expect(read).toHaveBeenCalledTimes(2)
    read.mockResolvedValue([{ name: 'subnet', value: true, locked: { product: 'Pumps', level: 'synced' } }])
    await act(async () => refreshDeviceSettings('D1'))
    expect(read).toHaveBeenCalledTimes(3)
    expect(read).toHaveBeenLastCalledWith('D1')
    expect(seen.a[0].value).toBe(true)
    expect(seen.b[0].value).toBe(true)
    expect(seen.c[0].value).toBe(false)
  })
})
