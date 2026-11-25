import { describe, it, expect } from 'vitest'
import { ConnectSituation, chooseRoutes } from './connectRoutes'

const none: ConnectSituation = { address: false, terminal: false, localPort: false }

describe('the service page’s primary way to connect', () => {
  it('the app with Access on: by the service’s address', () => {
    expect(chooseRoutes({ ...none, address: true, terminal: true, localPort: true })).toEqual({
      primary: 'address',
      others: ['terminal', 'localPort', 'public'],
    })
  })

  it('a browser and an ssh service: a terminal', () => {
    expect(chooseRoutes({ ...none, terminal: true })).toEqual({ primary: 'terminal', others: ['public'] })
  })

  it('a machine that offers a local port and nothing better: the local port', () => {
    expect(chooseRoutes({ ...none, localPort: true })).toEqual({ primary: 'localPort', others: ['public'] })
  })

  it('nothing else, a web service with no agent here included: through a public address', () => {
    expect(chooseRoutes(none)).toEqual({ primary: 'public', others: [] })
  })

  it('a route the person turned on leads: an open local port, or a connection through a public address', () => {
    expect(chooseRoutes({ ...none, terminal: true, localPort: true, localPortChosen: true }).primary).toBe('localPort')
    expect(chooseRoutes({ ...none, terminal: true, publicActive: true })).toEqual({
      primary: 'public',
      others: ['terminal'],
    })
  })
})
