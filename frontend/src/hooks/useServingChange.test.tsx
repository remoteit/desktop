import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { state } = vi.hoisted(() => ({ state: { account: 'acme', sub: undefined as string | undefined } }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select(state) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => state.account }))
vi.mock('../selectors/signIns', () => ({ selectSignInSub: () => state.sub }))

import { useServingChange } from './useServingChange'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('what shows the selected account', () => {
  it('is mounted again when another sign-in comes to serve it, and not when another account is selected', async () => {
    const mounted = vi.fn()
    const Page: React.FC = () => {
      React.useEffect(mounted, [])
      return null
    }
    const Shown: React.FC = () => <Page key={useServingChange()} />
    const root = createRoot(document.createElement('div'))
    const render = (change: Partial<typeof state> = {}) => {
      Object.assign(state, change)
      return act(async () => root.render(<Shown />))
    }
    await render()
    await render()
    expect(mounted).toHaveBeenCalledTimes(1)
    // Selecting a row another sign-in serves is a change of account, which pages follow themselves.
    await render({ account: 'labs', sub: 'sub-work' })
    expect(mounted).toHaveBeenCalledTimes(1)
    // The person picks another sign-in for it, then the one serving it leaves.
    await render({ sub: 'sub-third' })
    expect(mounted).toHaveBeenCalledTimes(2)
    await render({ sub: undefined })
    expect(mounted).toHaveBeenCalledTimes(3)
    await render({ account: 'acme' })
    expect(mounted).toHaveBeenCalledTimes(3)
  })
})
