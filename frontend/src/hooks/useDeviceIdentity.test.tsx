import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { served, store } = vi.hoisted(() => ({
  served: { current: { duplicates: true } as any },
  store: { copies: new Map<string, any[]>(), listeners: new Set<() => void>(), request: vi.fn() },
}))
// groupCopies is the service's own (deviceIdentity.test.ts): here, by the original's id.
vi.mock('../services/deviceIdentity', () => ({
  groupCopies: (list: any[]) => {
    const groups = new Map<string, any[]>()
    for (const copy of list) groups.set(copy.duplicateOf.id, [...(groups.get(copy.duplicateOf.id) || []), copy])
    return groups
  },
  deviceIdentityServed: () => Promise.resolve(served.current),
  duplicateCopies: (accountId: string) => store.copies.get(accountId),
  subscribeDuplicateCopies: (listener: () => void) => {
    store.listeners.add(listener)
    return () => store.listeners.delete(listener)
  },
  requestDuplicateCopies: store.request,
}))

import { useDuplicateCopies } from './useDeviceIdentity'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let groups: Map<string, any[]>
const Probe: React.FC<{ accountId?: string; reading?: boolean }> = ({ accountId, reading }) => {
  groups = useDuplicateCopies(accountId, reading)
  return null
}

async function render(props: { accountId?: string; reading?: boolean }) {
  await act(async () => root.render(<Probe {...props} />))
}

beforeEach(() => {
  served.current = { duplicates: true }
  store.copies.clear()
  store.request.mockReset()
  root = createRoot(document.createElement('div'))
})

afterEach(() => act(() => root.unmount()))

describe('useDuplicateCopies', () => {
  it("reads the account's copies once, and again each time the list's read ends", async () => {
    await render({ accountId: 'A1', reading: false })
    expect(store.request.mock.calls).toEqual([['A1', false]])
    await render({ accountId: 'A1', reading: true })
    expect(store.request).toHaveBeenCalledTimes(1)
    await render({ accountId: 'A1', reading: false })
    expect(store.request.mock.calls[1]).toEqual(['A1', true])
  })

  it('groups the copies by the device each copies, as they arrive', async () => {
    await render({ accountId: 'A1' })
    expect(groups.size).toBe(0)
    store.copies.set('A1', [
      { id: 'Y1', duplicateOf: { id: 'X1' } },
      { id: 'Y2', duplicateOf: { id: 'X1' } },
      { id: 'Z1', duplicateOf: { id: 'X2' } },
    ])
    await act(async () => store.listeners.forEach(listener => listener()))
    expect(groups.get('X1')!.map(c => c.id)).toEqual(['Y1', 'Y2'])
    expect(groups.get('X2')!.map(c => c.id)).toEqual(['Z1'])
  })

  it('asks nothing where the API has no duplicates, or for no account', async () => {
    served.current = { duplicates: false }
    await render({ accountId: 'A1' })
    served.current = { duplicates: true }
    await render({})
    expect(store.request).not.toHaveBeenCalled()
  })
})
