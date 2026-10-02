import { AddressInfo } from 'net'
import { createServer } from 'http'
import SocketIO from 'socket.io'
import socketioAuth from 'socketio-auth'
import { io as connect, Socket } from 'socket.io-client'
import ConnectionPool from './ConnectionPool'
import Controller from './Controller'
import EventBus from './EventBus'
import server from './server'
import user from './User'

jest.mock('./index', () => ({ __esModule: true, default: {} }))
jest.mock('./Logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))
jest.mock('./cliInterface', () => ({ __esModule: true, default: { readUser: jest.fn(), data: {}, EVENTS: {} } }))
jest.mock('./LAN', () => ({ __esModule: true, default: { EVENTS: {} } }))

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
    const pool = { nextFreePort: async () => 33001, clear: jest.fn(), clearRecent: jest.fn(), clearErrors: jest.fn() }
    new Controller(io, pool as unknown as ConnectionPool)
    http.listen(0, '127.0.0.1', () => {
      url = `http://127.0.0.1:${(http.address() as AddressInfo).port}`
      done()
    })
  })

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

  const authenticate = async (socket: Socket, attempt: object) => {
    const answered = Promise.race([next(socket, 'authenticated'), next(socket, 'unauthorized')])
    socket.emit('authentication', attempt)
    await answered
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
    await authenticate(impostor, { username: credentials.username, authHash: 'wrong' })

    const window = await open()
    await authenticate(window, credentials)

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
})
