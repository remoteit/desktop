import io from 'socket.io-client'
import { config } from 'dotenv'
import Connection, { ConnectionData } from '../../src/models/connection'
import { PeerConnection } from '../../src/models/peer-connection'
import { Server } from '../../src/server'

config()

const username = process.env.TEST_USERNAME
const authHash = process.env.TEST_AUTHHASH
const serviceID = process.env.TEST_DEVICE_ID
const deviceID = process.env.TEST_DEVICE_ID

describe('e2e/server', () => {
  let socket: SocketIOClient.Socket

  async function emit<T>(message: string, ...args: any[]): Promise<T> {
    return new Promise(success => socket.emit(message, ...args, success))
  }

  async function on<T>(message: string): Promise<T> {
    return new Promise(success => socket.on(message, success))
  }

  async function cleanup() {
    await emit(Server.ACTIONS.disconnectAll)
    await emit(Server.ACTIONS.resetAuth)
    // return Promise.all([
    //   emit(Server.ACTIONS.disconnectAll),
    //   emit(Server.ACTIONS.resetAuth),
    // ])
  }

  beforeEach(async () => {
    socket = io('https://desktop.rt3.io')
    await on('connect')
    // await cleanup()
  })

  describe('authentication', () => {
    xtest('should emit an error if not authorized', async done => {
      socket.emit(Server.ACTIONS.list)
      socket.on('error', (e: string) => {
        expect(e).toBe('not authorized')
        done()
      })
    })

    test('can set authentication', async done => {
      socket.on(Server.EVENTS.authorized, (resp: { username: string }) => {
        expect(resp.username).toBe(username)
        done()
      })
      socket.emit(Server.EVENTS.authenticate, { username, authHash })
    })

    xtest('can change authentication', async () => {
      await emit(Server.EVENTS.authenticate, { username, authHash })
      // const data = await on<{ username: string; connections: Connection[] }>(
      //   Server.EVENTS.authorized
      // )
      await emit(Server.EVENTS.authenticate, { username: 'someguy', authHash })
      const resp = await on<{ username: string }>(Server.EVENTS.authorized)
      expect(resp.username).toBe('someguy')
    })
  })

  describe('once authorized', () => {
    beforeEach(async () => {
      await emit('authenticate', { username, authHash })
    })

    describe('creates a connection', () => {
      test('returns the connection in the callback', async () => {
        const conn = await emit<ConnectionData>(Server.ACTIONS.connect, {
          deviceID,
          serviceID,
        })
        expect(conn.serviceID).toEqual(serviceID)
        expect(typeof conn.proxyPort).toBe('number')
        expect(typeof conn.peerPort).toBe('number')
      })

      test('successful connection emits event', async () => {
        socket.emit(Server.ACTIONS.connect, { deviceID, serviceID })
        const conn = await on<ConnectionData>(PeerConnection.EVENTS.connected)
        expect(conn.serviceID).toEqual(serviceID)
      })
    })

    describe('disconnect from a service', () => {
      test('can remove a connection by service ID', async () => {
        await emit(Server.ACTIONS.connect, { deviceID, serviceID })
        await emit(Server.ACTIONS.disconnect, serviceID)
        const conn = await emit<ConnectionData>(Server.ACTIONS.list)
        expect(conn).toEqual([])
      })

      test('can disconnect from all services', async () => {
        await emit(Server.ACTIONS.connect, { deviceID, serviceID })
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

      test('can request current connections with event', async () => {
        const connection = await emit<ConnectionData>(Server.ACTIONS.connect, {
          deviceID,
          serviceID,
        })
        const connections = await emit<ConnectionData[]>(Server.ACTIONS.list)
        expect(connections).toEqual([connection])
      })
    })
  })

  afterEach(async () => {
    await cleanup()
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
