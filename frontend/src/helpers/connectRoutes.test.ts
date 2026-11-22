import { describe, it, expect } from 'vitest'
import { ConnectSituation, chooseRoutes } from './connectRoutes'

const none: ConnectSituation = { address: false, browser: false, terminal: false, localPort: false }

describe('the service page’s primary way to connect', () => {
  it('the app with Access on: by the service’s address', () => {
    expect(chooseRoutes({ ...none, address: true, terminal: true, localPort: true })).toEqual({
      primary: 'address',
      others: ['terminal', 'localPort', 'public'],
    })
  })

  it('a browser and a web service: in the browser, the public address one click away', () => {
    expect(chooseRoutes({ ...none, browser: true })).toEqual({ primary: 'browser', others: ['public'] })
    expect(chooseRoutes({ ...none, browser: true, browserReachable: true }).primary).toBe('browser')
  })

  it('a web service whose address does not open from here: never the primary, still offered last', () => {
    expect(chooseRoutes({ ...none, browser: true, browserReachable: false })).toEqual({
      primary: 'public',
      others: ['browser'],
    })
  })

  it('a browser and an ssh service: a terminal', () => {
    expect(chooseRoutes({ ...none, terminal: true })).toEqual({ primary: 'terminal', others: ['public'] })
  })

  it('a machine that offers a local port and nothing better: the local port', () => {
    expect(chooseRoutes({ ...none, localPort: true })).toEqual({ primary: 'localPort', others: ['public'] })
  })

  it('nothing else: through a public address', () => {
    expect(chooseRoutes(none)).toEqual({ primary: 'public', others: [] })
  })

  it('a route the person turned on leads: an open local port, or a connection through a public address', () => {
    expect(chooseRoutes({ ...none, terminal: true, localPort: true, localPortChosen: true }).primary).toBe('localPort')
    expect(chooseRoutes({ ...none, browser: true, publicActive: true })).toEqual({
      primary: 'public',
      others: ['browser'],
    })
  })
})
