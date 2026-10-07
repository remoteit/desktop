import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'

const redux = vi.hoisted(() => ({ state: {} }))

vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select(redux.state),
  useDispatch: () => ({}),
}))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('./Icon', () => ({ Icon: () => null }))

import '../store'
import { DeviceScriptingMenu } from './DeviceScriptingMenu'

const device = (ownerId: string, hidden = false) =>
  ({ id: 'DEVICE', permissions: ['SCRIPTING'], owner: { id: ownerId }, hidden } as IDevice)

const offered = (shown: IDevice, lists: Record<string, IDevice[]> = {}, activeId = 'ORG-B') => {
  redux.state = {
    accounts: { activeId },
    auth: { user: { id: 'USER' } },
    devices: { default: { all: [] }, ...Object.fromEntries(Object.entries(lists).map(([id, all]) => [id, { all }])) },
  }
  return renderToStaticMarkup(<DeviceScriptingMenu device={shown} />).includes('SCRIPT')
}

describe('DeviceScriptingMenu', () => {
  it('is offered for a device the active account owns', () => {
    expect(offered(device('ORG-B'))).toBe(true)
  })

  it('is offered for a device shared into the personal account list', () => {
    const shared = device('ORG-A')
    expect(offered(shared, { USER: [shared] }, 'USER')).toBe(true)
  })

  it('is hidden for a device from another account', () => {
    const foreign = device('ORG-A')
    expect(offered(foreign, { 'ORG-A': [foreign] })).toBe(false)
  })

  it('is hidden for another account device fetched by id into the active list', () => {
    const fetched = device('ORG-A', true)
    expect(offered(fetched, { 'ORG-B': [fetched] })).toBe(false)
  })
})
