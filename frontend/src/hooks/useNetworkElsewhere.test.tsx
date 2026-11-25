import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { state } = vi.hoisted(() => ({ state: { several: true, reach: 'acme:|acme:sub-work' } }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectRow: () => 'acme' }))
vi.mock('../selectors/signIns', () => ({
  getSignIns: () => (state.several ? { 'sub-work': {} } : {}),
  selectReachPairs: () => state.reach,
}))
vi.mock('../services/networkElsewhere', () => ({}))
vi.mock('./useDeviceNetworks', () => ({}))

import { useElsewhere } from './useNetworkElsewhere'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

/* The page as it uses the hook: it waits while the network is looked for, then says what it has. */
const page = (find: (id: string) => Promise<unknown>, missing = true) => {
  const Page: React.FC = () => <div>{useElsewhere('net-1', missing, find) ? 'loading' : 'No such network'}</div>
  const container = document.createElement('div')
  const root = createRoot(container)
  return { container, root, render: () => act(async () => root.render(<Page />)) }
}

describe('a network looked for in the other rows here', () => {
  it('stops waiting when it is found nowhere: the page says so, and it is not looked for again', async () => {
    let answer!: (value: unknown) => void
    const find = vi.fn(() => new Promise(resolve => (answer = resolve)))
    const { container, render } = page(find)
    await render()
    // Looked for, the page rendered again meanwhile (beginning the search is itself a change).
    expect(container.textContent).toBe('loading')
    await render()
    expect(find).toHaveBeenCalledTimes(1)
    await act(async () => answer(undefined))
    expect(container.textContent).toBe('No such network')
    await render()
    expect(find).toHaveBeenCalledTimes(1)
    expect(container.textContent).toBe('No such network')
  })

  it('looks again when who can be asked changes: a sign-in brought into use since was not asked', async () => {
    const find = vi.fn(async () => undefined)
    const { container, render } = page(find)
    await render()
    await render()
    expect(find).toHaveBeenCalledTimes(1)
    expect(container.textContent).toBe('No such network')
    state.reach = 'acme:|acme:sub-work|labs:sub-other'
    await render()
    expect(find).toHaveBeenCalledTimes(2)
    state.reach = 'acme:|acme:sub-work'
  })

  it('stops waiting when the search fails', async () => {
    const find = vi.fn(async () => {
      throw new Error('unreachable')
    })
    const { container, render } = page(find)
    await render()
    expect(container.textContent).toBe('No such network')
  })

  it('does not look, or wait, with one sign-in in use — nor for a network the row has', async () => {
    state.several = false
    const find = vi.fn(async () => undefined)
    const one = page(find)
    await one.render()
    expect(one.container.textContent).toBe('No such network')
    state.several = true
    const has = page(find, false)
    await has.render()
    expect(has.container.textContent).toBe('No such network')
    expect(find).not.toHaveBeenCalled()
  })

  it('sets nothing once the page is gone', async () => {
    let answer!: (value: unknown) => void
    const find = vi.fn(() => new Promise(resolve => (answer = resolve)))
    const { root, render } = page(find)
    await render()
    await act(async () => root.unmount())
    const complained = vi.spyOn(console, 'error').mockImplementation(() => {})
    await act(async () => answer(undefined))
    expect(complained).not.toHaveBeenCalled()
    complained.mockRestore()
  })
})
