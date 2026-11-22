import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

const state = vi.hoisted(() => ({ created: false, readsStarted: 0 }))
const NEW = { id: 'N9', name: 'UX check' }

// Each read answers what was there when it started, after a while: a read started before the network was created
// answers without it.
vi.mock('../services/graphQLDeviceNetworks', () => ({
  graphQLDeviceNetworks: async () => {
    state.readsStarted++
    const created = state.created
    await new Promise(resolve => setTimeout(resolve, 20))
    return created ? [NEW] : []
  },
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'A1' }))
vi.mock('../models/networks', () => ({ selectNetwork: () => ({ id: '', name: '' }) }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../store', () => ({}))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({}),
  useDispatch: () => ({
    networks: {
      addNetwork: async () => {
        state.created = true
        return NEW.id
      },
    },
  }),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { NetworkAdd } from './NetworkAdd'
import { useDeviceNetworks } from '../hooks/useDeviceNetworks'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// The list beside the form, as the Networks page reads it; and what the network's page would find when it opens.
const List: React.FC = () => {
  const { networks } = useDeviceNetworks()
  return <ul data-list>{Array.isArray(networks) && networks.map(n => <li key={n.id}>{n.name}</li>)}</ul>
}
const seen: { path: string; listed: boolean }[] = []
const Opened: React.FC<{ path: string }> = ({ path }) => {
  const { networks } = useDeviceNetworks()
  seen.push({ path, listed: Array.isArray(networks) && networks.some(n => n.id === NEW.id) })
  return null
}

describe('creating a network', () => {
  it('opens the new network, already in the list, even when a read was under way', async () => {
    const container = document.createElement('div')
    await act(async () =>
      createRoot(container).render(
        <MemoryRouter initialEntries={['/networks/add']}>
          <List />
          <Route path="/networks/add">
            <NetworkAdd />
          </Route>
          <Route path="/networks/:id" render={({ location }) => <Opened path={location.pathname} />} />
        </MemoryRouter>
      )
    )
    expect(state.readsStarted).toBe(1)

    const input = container.querySelector('input') as HTMLInputElement
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(input, 'UX check')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise(resolve => setTimeout(resolve, 80))
    })

    const opened = seen.filter(entry => entry.path === '/networks/N9')
    expect(opened.length).toBeGreaterThan(0)
    expect(opened.every(entry => entry.listed)).toBe(true)
    expect(container.querySelector('[data-list]')!.textContent).toBe('UX check')
  })
})
