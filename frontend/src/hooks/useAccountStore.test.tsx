import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { account } = vi.hoisted(() => ({ account: { id: 'A' } }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => account.id }))

import { accountStore } from './useAccountStore'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('something of the active account, shared by a list and the page beside it', () => {
  it('is read once for both, again on reload — and a reload during a read reads again after it', async () => {
    const answers: ((value: string) => void)[] = []
    const read = vi.fn((accountId: string) => new Promise<string>(resolve => answers.push(value => resolve(`${accountId}:${value}`))))
    const useStore = accountStore(read)
    let reload: () => Promise<void> = async () => {}
    const Show: React.FC<{ name: string }> = ({ name }) => {
      const store = useStore()
      reload = store.reload
      return <div data-show={name}>{store.value ?? 'reading'}</div>
    }
    const container = document.createElement('div')
    await act(async () =>
      createRoot(container).render(
        <>
          <Show name="list" />
          <Show name="page" />
        </>
      )
    )
    expect(read).toHaveBeenCalledTimes(1)
    expect(container.textContent).toBe('readingreading')
    await act(async () => answers[0]('first'))
    expect(container.querySelector('[data-show="list"]')?.textContent).toBe('A:first')
    expect(container.querySelector('[data-show="page"]')?.textContent).toBe('A:first')

    // A change made on the page while the list is still being read again.
    act(() => {
      reload()
    })
    act(() => {
      reload()
    })
    expect(read).toHaveBeenCalledTimes(2)
    await act(async () => answers[1]('stale'))
    expect(read).toHaveBeenCalledTimes(3)
    await act(async () => answers[2]('latest'))
    expect(container.querySelector('[data-show="list"]')?.textContent).toBe('A:latest')
  })
})
