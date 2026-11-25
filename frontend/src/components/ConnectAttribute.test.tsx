import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { state } = vi.hoisted(() => ({
  state: { webAddress: true as boolean | undefined, address: undefined as string | undefined },
}))
vi.mock('../hooks/useApplication', () => ({ useApplication: () => ({ commandString: 'x' }) }))
vi.mock('../hooks/useWebAddress', () => ({
  useWebTarget: () => ({ id: 'S1', deviceID: 'D1', web: true }),
  useWebAddress: () => state.webAddress,
  useKnownWebAddress: (_target: unknown, on: boolean) => (on ? state.address : undefined),
}))
vi.mock('../helpers/connectionHelper', () => ({ copyReady: () => true }))
vi.mock('../buttons/ComboButton', () => ({ ComboButton: ({ children }: any) => <div>{children}</div> }))
vi.mock('../buttons/LaunchButton', () => ({ LaunchButton: () => <i data-launch /> }))
vi.mock('../buttons/CopyIconButton', () => ({
  CopyIconButton: ({ value, app }: any) => <i data-copy={value ?? app?.commandString} />,
}))

import { ConnectAttribute } from './ConnectAttribute'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const ADDRESS = 'https://web-acme.solo.r3proxy.com'
let container: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(state, { webAddress: true, address: ADDRESS })
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
})
const copies = async (connection: object) => {
  await act(async () =>
    root.render(
      <ConnectAttribute {...({ service: { id: 'S1' }, connection: { online: true, ...connection } } as any)} />
    )
  )
  return [...container.querySelectorAll<HTMLElement>('[data-copy]')].map(copy => copy.dataset.copy)
}

describe('a service’s chip', () => {
  it('copies its web address, where it is opened at one and there is one', async () => {
    expect(await copies({})).toEqual([ADDRESS])
    expect(container.querySelector('[data-launch]')).toBeNull()
    state.address = undefined
    expect(await copies({})).toEqual([])
    Object.assign(state, { webAddress: false, address: ADDRESS })
    expect(await copies({})).toEqual([])
  })

  it('copies a connection’s own endpoint, where there is one', async () => {
    expect(await copies({ enabled: true })).toEqual(['x'])
    expect(container.querySelector('[data-launch]')).not.toBeNull()
  })
})
