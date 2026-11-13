import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_SERVICE } from '@common/constants'

const { browser, state } = vi.hoisted(() => ({
  browser: { hasBackend: true },
  state: { user: { attributes: {} as ILookup<any> }, connections: { all: [] as IConnection[] } },
}))

vi.mock('../services/browser', () => ({ default: browser }))
vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../constants', () => ({}))
vi.mock('../store', () => ({ store: { getState: () => state } }))
vi.mock('../selectors/connections', () => ({}))
vi.mock('../selectors/accounts', () => ({ selectActiveUser: () => ({ id: 'user-1', email: 'user@example.com' }) }))
vi.mock('../selectors/devices', () => ({ getAllDevices: vi.fn(), selectById: () => [] }))

import { newConnection, getRoute } from './connectionHelper'

const service = (route?: IRouteType): IService => ({
  ...DEFAULT_SERVICE,
  id: 'service-1',
  deviceID: 'device-1',
  typeID: 28,
  attributes: route ? { route } : {},
})

describe('newConnection route defaults', () => {
  beforeEach(() => {
    browser.hasBackend = true
    state.user.attributes = {}
  })

  it('uses adaptive routing when nothing is set', () => {
    expect(getRoute(newConnection(service()))).toBe('failover')
  })

  it.each<IRouteType>(['p2p', 'proxy', 'public'])('applies the service default route %s', route => {
    expect(getRoute(newConnection(service(route)))).toBe(route)
  })

  it('applies the connection type default route', () => {
    state.user.attributes = { connectionDefaults: { 28: { route: 'proxy' } } }
    expect(getRoute(newConnection(service()))).toBe('proxy')
  })

  it('lets the service default route override the connection type default', () => {
    state.user.attributes = { connectionDefaults: { 28: { route: 'proxy' } } }
    expect(getRoute(newConnection(service('p2p')))).toBe('p2p')
  })

  it('always uses the public proxy without a backend', () => {
    browser.hasBackend = false
    expect(getRoute(newConnection(service()))).toBe('public')
    expect(getRoute(newConnection(service('p2p')))).toBe('public')
  })
})
