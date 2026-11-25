import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { state, openWeb } = vi.hoisted(() => ({
  state: { webAddress: true as boolean | undefined, address: undefined as string | undefined, connection: {} as any },
  openWeb: vi.fn(),
}))
const service = { id: 'S1', deviceID: 'D1', state: 'active', attributes: {} }
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('../selectors/connections', () => ({ selectConnection: () => state.connection }))
vi.mock('../selectors/devices', () => ({ selectById: () => [service, { id: 'D1' }] }))
vi.mock('../hooks/useWebAddress', () => ({
  useWebTarget: () => ({ id: 'S1', deviceID: 'D1', web: true }),
  useWebAddress: () => state.webAddress,
  useKnownWebAddress: (_target: unknown, on: boolean) => (on ? state.address : undefined),
  useOpenWebService: () => ({ opening: false, open: openWeb }),
}))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, onClick }: any) => <button onClick={onClick}>{title}</button>,
}))
vi.mock('./ConnectionListItem', () => ({
  ConnectionListItem: ({ children, connected }: any) => <div data-connected={connected}>{children}</div>,
}))

import { NetworkListItem } from './NetworkListItem'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(state, { webAddress: true, address: 'https://web-acme.solo.r3proxy.com' })
  state.connection = { id: 'S1', name: 'web', enabled: false, connected: false }
  service.state = 'active'
  openWeb.mockReset()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
})
const render = (session?: ISession) =>
  act(async () =>
    root.render(
      <NetworkListItem serviceId="S1" session={session}>
        <i data-child />
      </NetworkListItem>
    )
  )
const open = () => container.querySelector('button')

describe('a web service with a web address, in a network', () => {
  it('is opened from its row with one click, and is no connection', async () => {
    await render()
    await act(async () => open()!.click())
    expect(openWeb).toHaveBeenCalledOnce()
    expect(container.querySelector<HTMLElement>('[data-connected]')!.dataset.connected).toBe('false')
    expect(container.querySelector('[data-child]')).not.toBeNull()
  })

  it('has no such button with no address, the gate off or not known, offline, or connected', async () => {
    state.address = undefined
    await render()
    expect(open()).toBeNull()
    state.address = 'https://web-acme.solo.r3proxy.com'
    for (const webAddress of [false, undefined]) {
      state.webAddress = webAddress
      await render()
      expect(open()).toBeNull()
    }
    state.webAddress = true
    service.state = 'inactive'
    await render()
    expect(open()).toBeNull()
    service.state = 'active'
    state.connection = { ...state.connection, enabled: true }
    await render()
    expect(open()).toBeNull()
    expect(container.querySelector<HTMLElement>('[data-connected]')!.dataset.connected).toBe('true')
  })
})
