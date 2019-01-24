import io from 'socket.io-client'
import { config } from 'dotenv'
import { ConnectionData } from '../../src/models/connection'
import { PeerConnection } from '../../src/models/peer-connection'
import { Server } from '../../src/server'

config()

const username = process.env.TEST_USERNAME
const authHash = process.env.TEST_AUTHHASH
const serviceID = process.env.TEST_SERVICE_ID

describe('e2e/server', () => {
  let socket: SocketIOClient.Socket

  async function emit<T>(message: string, ...args: any[]): Promise<T> {
    return new Promise(success => socket.emit(message, ...args, success))
  }

  async function on<T>(message: string): Promise<T> {
    return new Promise(success => socket.on(message, success))
  }

  beforeEach(() => {
    socket = io('https://desktop.rt3.io')
  })

  describe('authentication', () => {
    test('should emit an error if not authorized', async done => {
      socket.emit(Server.ACTIONS.list)
      socket.on('error', (e: string) => {
        expect(e).toBe('not authorized')
        done()
      })
    })

    test('can set authentication', async done => {
      socket.emit(Server.EVENTS.authenticate, { username, authHash })
      socket.on(Server.EVENTS.authorized, (resp: { username: string }) => {
        expect(resp.username).toBe(username)
        done()
      })
      socket.on(Server.EVENTS.unauthorized, () => {
        throw new Error('Not authorized!')
      })
    })

    test('can change authentication', async done => {
      socket.emit(Server.EVENTS.authenticate, { username, authHash })
      socket.on(Server.EVENTS.authorized, () => {
        socket.emit(Server.EVENTS.authenticate, {
          username: 'someguy',
          authHash,
        })
        socket.on(Server.EVENTS.authorized, (resp: { username: string }) => {
          expect(resp.username).toBe('someguy')
          done()
        })
      })
    })
  })

  describe('once authorized', () => {
    beforeEach(() => {
      socket.emit('authenticate', { username, authHash })
    })

    describe('creates a connection', () => {
      test('returns the connection in the callback', async () => {
        const conn = await emit<ConnectionData>(
          Server.ACTIONS.connect,
          serviceID
        )
        expect(conn.serviceID).toEqual(serviceID)
        expect(typeof conn.proxyPort).toBe('number')
        expect(typeof conn.peerPort).toBe('number')
      })

      test('successful connection emits event', async () => {
        socket.emit(Server.ACTIONS.connect, serviceID)
        const conn = await on<ConnectionData>(PeerConnection.EVENTS.connected)
        expect(conn.serviceID).toEqual(serviceID)
      })
    })

    describe('disconnect from a service', () => {
      test('can remove a connection by service ID', async () => {
        await emit(Server.ACTIONS.connect, serviceID)
        await emit(Server.ACTIONS.disconnect, serviceID)
        const conn = await emit<ConnectionData>(Server.ACTIONS.list)
        expect(conn).toEqual([])
      })

      test('can disconnect from all services', async () => {
        await emit(Server.ACTIONS.connect, serviceID)
        await emit<ConnectionData>(Server.ACTIONS.disconnectAll)
        const connections = await emit<ConnectionData[]>(Server.ACTIONS.list)
        expect(connections).toEqual([])
      })

      xtest('does nothing if trying to remove non-existant connection', async () => {})
    })

    describe('gets current connections', () => {
      test('sends current connections on authorization', async done => {
        socket.on(
          Server.EVENTS.authorized,
          (resp: { connections: ConnectionData[]; username: string }) => {
            expect(resp.connections).toEqual([])
            done()
          }
        )
      })

      test('can request current connections with event', async done => {
        socket.emit(
          Server.ACTIONS.connect,
          serviceID,
          (connection: ConnectionData) => {
            socket.emit(
              Server.ACTIONS.list,
              (connections: ConnectionData[]) => {
                expect(connections).toEqual([connection])
                done()
              }
            )
          }
        )
      })
    })
  })

  afterEach(() => {
    socket.emit(Server.ACTIONS.disconnectAll)
    socket.close()
  })
})

/**
 * TODO: Handle these events:
 * - connect_error
 * - conenct_timeout
 * - error
 * - disconnect
 * - reconnect
 * - reconnect_attempt
 * - reconnecting
 * - reconnect_error
 * - reconnect_failed
 */
