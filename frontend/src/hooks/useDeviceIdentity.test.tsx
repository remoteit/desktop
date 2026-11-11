import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { served, store } = vi.hoisted(() => ({
  served: { current: { duplicates: true } as any },
  store: {
    copies: new Map<string, any[]>(),
    byOriginal: new Map<string, any[]>(),
    listeners: new Set<() => void>(),
    request: vi.fn(),
    requestOf: vi.fn(),
  },
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
  copiesByOriginal: () => store.byOriginal,
  requestCopiesOf: store.requestOf,
}))

import { useDuplicateCopies, useKnownCopies } from './useDeviceIdentity'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let groups: Map<string, any[]>
let known: any[]
type Props = { accountId?: string; reading?: boolean; listed?: Pick<IDevice, 'id' | 'copyCount'>[] }
const Probe: React.FC<Props> = ({ accountId, reading, listed }) => {
  groups = useDuplicateCopies(accountId, reading, listed)
  known = useKnownCopies(accountId)
  return null
}

async function render(props: Props) {
  await act(async () => root.render(<Probe {...props} />))
}
const changed = () => act(async () => store.listeners.forEach(listener => listener()))

beforeEach(() => {
  served.current = { duplicates: true }
  store.copies.clear()
  store.byOriginal = new Map()
  store.request.mockReset()
  store.requestOf.mockReset()
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

  it('where the API counts copies: those of the listed devices with any, read together, wherever they are listed', async () => {
    served.current = { duplicates: true, copyCount: true }
    const listed = [
      { id: 'X1', copyCount: 2 },
      { id: 'X2', copyCount: 0 },
      { id: 'X3', copyCount: 1 },
    ]
    await render({ accountId: 'A1', reading: false, listed })
    expect(store.requestOf.mock.calls).toEqual([[['X1', 'X3'], false]])
    expect(store.request).not.toHaveBeenCalled()
    store.byOriginal = new Map([
      [
        'X1',
        [
          { id: 'Y1', name: 'pump (copy)', duplicateOf: { id: 'X1' } },
          { id: 'Y2', duplicateOf: { id: 'X1' } },
        ],
      ],
      ['X3', []],
    ])
    await changed()
    expect([...groups.keys()]).toEqual(['X1'])
    expect(groups.get('X1')!.map(c => c.id)).toEqual(['Y1', 'Y2'])
    expect(known.map(c => c.id)).toEqual(['Y1', 'Y2'])
    // The list read again: the same devices' copies read again.
    await render({ accountId: 'A1', reading: true, listed })
    await render({ accountId: 'A1', reading: false, listed })
    expect(store.requestOf.mock.calls[1]).toEqual([['X1', 'X3'], true])
    // A device whose copies were all decided on is listed with none: nothing under it, nothing asked.
    await render({ accountId: 'A1', reading: false, listed: [{ id: 'X1', copyCount: 0 }] })
    expect(groups.size).toBe(0)
    expect(store.requestOf).toHaveBeenCalledTimes(2)
  })

  it("an API that does not count copies, or a caller that lists nothing: the account's, read once", async () => {
    served.current = { duplicates: true, copyCount: false }
    await render({ accountId: 'A1', listed: [{ id: 'X1' }] })
    served.current = { duplicates: true, copyCount: true }
    root.unmount()
    root = createRoot(document.createElement('div'))
    await render({ accountId: 'A2' })
    expect(store.request.mock.calls).toEqual([
      ['A1', false],
      ['A2', false],
    ])
    expect(store.requestOf).not.toHaveBeenCalled()
  })
})
