import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// useSubnetReach asks again, a few times, when told no by a daemon that is here: nothing else asks again while the
// page is open, so a "no" that did not last showed only Connect until a reload.
const local = vi.hoisted(() => ({
  ask: vi.fn(),
  absent: false,
  forgotten: new Set<() => void>(),
}))
vi.mock('./useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('./useDeviceSessionInfo', () => ({
  useDeviceSessionInfo: () => ({
    subnetName: 'mac-ada.on.solo.remote.it',
    services: { S1: 'mac-ada.on.solo.remote.it' },
  }),
}))
vi.mock('../services/deviceSessionInfo', () => ({ requestServiceSessionInfo: vi.fn() }))
vi.mock('../services/localSubnet', () => ({
  localSubnetName: (...args: unknown[]) => local.ask(...args),
  localAbsent: () => local.absent,
  localSignIn: async () => null,
  onLocalForgotten: (listener: () => void) => {
    local.forgotten.add(listener)
    return () => local.forgotten.delete(listener)
  },
}))

import { REACH_RETRY_MS, SubnetReach, useSubnetReach } from './useLocalSubnetName'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const NAME = 'mac-ada.on.solo.remote.it'
const total = REACH_RETRY_MS.reduce((sum, ms) => sum + ms, 0)

describe('useSubnetReach', () => {
  let root: Root
  let seen: SubnetReach

  const Probe: React.FC = () => {
    seen = useSubnetReach('D1', 'S1')
    return null
  }
  const render = () => act(async () => root.render(<Probe />))
  const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

  beforeEach(() => {
    vi.useFakeTimers()
    root = createRoot(document.createElement('div'))
    local.ask.mockReset().mockResolvedValue(null)
    local.absent = false
    local.forgotten.clear()
  })
  afterEach(async () => {
    await act(() => root.unmount())
    vi.useRealTimers()
  })

  it('a "no" is asked again, anew, until the name works here', async () => {
    await render()
    expect(seen).toEqual({ name: NAME, local: undefined, checked: true })
    expect(local.ask).toHaveBeenCalledTimes(1)
    expect(local.ask).toHaveBeenLastCalledWith('S1', NAME, undefined)

    local.ask.mockResolvedValue({ name: NAME })
    await wait(REACH_RETRY_MS[0])
    expect(local.ask).toHaveBeenCalledTimes(2)
    expect(local.ask).toHaveBeenLastCalledWith('S1', NAME, true)
    expect(seen.local).toEqual({ name: NAME })

    await wait(total)
    expect(local.ask).toHaveBeenCalledTimes(2)
  })

  it('a name that never works here is asked a few times, then left', async () => {
    await render()
    await wait(total + 60_000)
    expect(local.ask).toHaveBeenCalledTimes(1 + REACH_RETRY_MS.length)
    expect(seen).toEqual({ name: NAME, local: undefined, checked: true })
  })

  it('no daemon here: not asked again — its backoff is its own', async () => {
    local.absent = true
    await render()
    await wait(total)
    expect(local.ask).toHaveBeenCalledTimes(1)
  })

  it('a sign-in here asks again, and the retries start over', async () => {
    await render()
    await wait(total)
    expect(local.ask).toHaveBeenCalledTimes(1 + REACH_RETRY_MS.length)
    await act(async () => local.forgotten.forEach(listener => listener()))
    expect(local.ask).toHaveBeenCalledTimes(2 + REACH_RETRY_MS.length)
    await wait(REACH_RETRY_MS[0])
    expect(local.ask).toHaveBeenCalledTimes(3 + REACH_RETRY_MS.length)
  })

  it('unmounted: nothing asked again', async () => {
    await render()
    await act(() => root.unmount())
    root = createRoot(document.createElement('div'))
    await wait(total)
    expect(local.ask).toHaveBeenCalledTimes(1)
  })
})
