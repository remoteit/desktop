import { AddressInfo } from 'net'
import { createServer } from 'http'
import SocketIO from 'socket.io'
import socketioAuth from 'socketio-auth'
import { io as connect, Socket } from 'socket.io-client'
import cli from './cliInterface'
import ConnectionPool from './ConnectionPool'
import Controller from './Controller'
import EventBus from './EventBus'
import electronInterface from './electronInterface'
import server from './server'
import user, { User } from './User'

jest.mock('./index', () => ({ __esModule: true, default: {} }))
jest.mock('./Logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))
jest.mock('./cliInterface', () => ({
  __esModule: true,
  default: { readUser: jest.fn(), signOut: jest.fn(), data: {}, EVENTS: {} },
}))
jest.mock('./LAN', () => ({ __esModule: true, default: { EVENTS: {} } }))
// user.signOut deletes the real user.json under environment.userPath
jest.mock('rimraf')

describe('backend/server broadcasts', () => {
  const credentials = { username: 'a@test', authHash: 'hash-a' }
  const sockets: Socket[] = []
  let io: SocketIO.Server
  let url: string

  beforeAll(done => {
    Object.assign(user, credentials)
    const http = createServer()
    io = new SocketIO.Server(http)
    socketioAuth(io, { authenticate: server.authenticate, postAuthenticate: server.postAuthenticate, timeout: 'none' })
    const pool = {
      nextFreePort: async () => 33001,
      clear: jest.fn(),
      clearRecent: jest.fn(),
      clearErrors: jest.fn(),
      clearMemory: jest.fn(),
    }
    new Controller(io, pool as unknown as ConnectionPool)
    http.listen(0, '127.0.0.1', () => {
      url = `http://127.0.0.1:${(http.address() as AddressInfo).port}`
      done()
    })
  })

  afterEach(() => io.disconnectSockets(true))

  afterAll(done => {
    sockets.forEach(socket => socket.close())
    io.close(() => done())
  })

  const next = (socket: Socket, event: string) => new Promise(resolve => socket.once(event, resolve))

  const open = async () => {
    const socket = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false })
    sockets.push(socket)
    await next(socket, 'connect')
    return socket
  }

  const authenticate = (socket: Socket, attempt: object) => {
    const answer = Promise.race(['authenticated', 'unauthorized'].map(event => next(socket, event).then(() => event)))
    socket.emit('authentication', attempt)
    return answer
  }

  const listen = (socket: Socket) => {
    const heard: string[] = []
    socket.onAny(event => heard.push(event))
    return heard
  }

  it('reaches signed-in sockets and no others', async () => {
    const stranger = await open()
    const impostor = await open()
    const strangerHeard = listen(stranger)
    const impostorHeard = listen(impostor)
    expect(await authenticate(impostor, { username: credentials.username, authHash: 'wrong' })).toBe('unauthorized')

    const window = await open()
    expect(await authenticate(window, credentials)).toBe('authenticated')

    const updated = next(window, ConnectionPool.EVENTS.updated)
    EventBus.emit(ConnectionPool.EVENTS.updated, { id: 'service-1' })
    expect(await updated).toEqual({ id: 'service-1' })

    const freePort = next(window, 'freePort')
    window.emit('freePort')
    expect(await freePort).toBe(33001)

    // One connection delivers in order, so a probe sent after the broadcasts arrives after anything they sent.
    const probes = [next(stranger, 'probe'), next(impostor, 'probe')]
    io.emit('probe')
    await Promise.all(probes)

    expect(strangerHeard).toEqual(['probe'])
    expect(impostorHeard).toEqual(['unauthorized', 'probe'])
  })

  it('stops reaching a socket once the account signs out, until it authenticates again', async () => {
    const window = await open()
    const heard = listen(window)
    expect(await authenticate(window, credentials)).toBe('authenticated')

    const signedOut = next(window, User.EVENTS.signedOut)
    window.emit('user/sign-out')
    await signedOut

    const probe = next(window, 'probe')
    EventBus.emit(ConnectionPool.EVENTS.updated, { id: 'service-2' })
    io.emit('probe')
    await probe
    expect(heard.slice(heard.indexOf(User.EVENTS.signedOut))).toEqual([User.EVENTS.signedOut, 'probe'])

    Object.assign(user, credentials)
    expect(await authenticate(window, credentials)).toBe('authenticated')
    const updated = next(window, ConnectionPool.EVENTS.updated)
    EventBus.emit(ConnectionPool.EVENTS.updated, { id: 'service-3' })
    expect(await updated).toEqual({ id: 'service-3' })
  })

  it('leaves the tray sign-out to any signed-in window, and does it itself once none is left', async () => {
    const signOut = (cli.signOut as jest.Mock).mockClear()
    Object.assign(user, credentials)
    const earlier = await open()
    expect(await authenticate(earlier, credentials)).toBe('authenticated')
    expect(await authenticate(await open(), credentials)).toBe('authenticated')
    server.socket?.disconnect(true)

    const relayed = next(earlier, electronInterface.EVENTS.signOut)
    EventBus.emit(electronInterface.EVENTS.signOut)
    await relayed
    expect(signOut).not.toHaveBeenCalled()

    const window = await open()
    expect(await authenticate(window, credentials)).toBe('authenticated')
    const signedOut = next(window, User.EVENTS.signedOut)
    window.emit('user/sign-out')
    await signedOut
    signOut.mockClear()

    EventBus.emit(electronInterface.EVENTS.signOut)
    await new Promise(resolve => setImmediate(resolve))
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
