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
import server, { isSocketOrigin } from './server'
import { WEB_PORT, SSL_PORT, START_URL } from './constants'
import user, { User } from './User'
import { parseAgentOwned } from '@common/agentOwner'

jest.mock('./index', () => ({ __esModule: true, default: {} }))
jest.mock('./Logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))
jest.mock('./cliInterface', () => ({
  __esModule: true,
  default: { readUser: jest.fn(), signOut: jest.fn(), isSignedOut: () => true, data: {}, EVENTS: {} },
}))
jest.mock('./LAN', () => ({ __esModule: true, default: { EVENTS: {} } }))
// user.signOut deletes the real user.json under environment.userPath
jest.mock('rimraf')

describe('backend/server broadcasts', () => {
  const credentials = { username: 'a@test', authHash: 'hash-a' }
  const sockets: Socket[] = []
  let io: SocketIO.Server
  let url: string
  const nextFreePort = jest.fn(async () => 33001)
  const appOrigin = new URL(START_URL).origin

  beforeAll(done => {
    Object.assign(user, credentials)
    const http = createServer()
    io = new SocketIO.Server(http, { allowRequest: server.allowRequest })
    socketioAuth(io, { authenticate: server.authenticate, postAuthenticate: server.postAuthenticate, timeout: 'none' })
    const pool = {
      nextFreePort,
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

  const dial = (origin = appOrigin) => {
    const socket = connect(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      extraHeaders: { origin },
    })
    sockets.push(socket)
    return socket
  }

  const open = async (origin?: string) => {
    const socket = dial(origin)
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

  it('lets a signed-in window release the agent, then drops every window signed in as its owner', async () => {
    const signOut = (cli.signOut as jest.Mock).mockClear()
    Object.assign(user, { ...credentials, signedIn: true })
    const popout = await open()
    expect(await authenticate(popout, credentials)).toBe('authenticated')
    const window = await open()
    expect(await authenticate(window, credentials)).toBe('authenticated')
    const [popoutId, windowId] = [popout.id, window.id]
    const dropped = next(window, 'disconnect')

    expect(await window.emitWithAck('agent/release')).toBe(true)
    await dropped
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(user.signedIn).toBe(false)
    expect(io.sockets.sockets.has(popoutId!)).toBe(false)
    expect(io.sockets.sockets.has(windowId!)).toBe(false)
  })

  it("a window that has signed out cannot release the next owner's agent", async () => {
    Object.assign(user, credentials)
    const window = await open()
    expect(await authenticate(window, credentials)).toBe('authenticated')
    const signedOut = next(window, User.EVENTS.signedOut)
    window.emit('user/sign-out')
    await signedOut

    const signOut = (cli.signOut as jest.Mock).mockClear()
    Object.assign(user, { ...credentials, signedIn: true })
    expect(await window.emitWithAck('agent/release')).toBe(false)
    expect(signOut).not.toHaveBeenCalled()
    expect(user.signedIn).toBe(true)
  })

  it('refuses another account while the agent has an owner, and only a signed-in window can release it', async () => {
    const signOut = (cli.signOut as jest.Mock).mockClear()
    const checkSignIn = jest.spyOn(user, 'checkSignIn')
    Object.assign(cli.data, { admin: { guid: 'guid-a', username: credentials.username } })
    const other = await open()
    const refused = next(other, 'unauthorized')
    const attempt = { username: 'b@test', authHash: 'hash-b', guid: 'guid-b' }
    other.emit('authentication', attempt)
    const { message } = (await refused) as { message: string }

    expect(parseAgentOwned(message)).toEqual(expect.objectContaining({ username: credentials.username }))
    expect(checkSignIn).not.toHaveBeenCalled()

    // The server handles one socket's packets in order, so once the next refusal arrives the release was ignored.
    other.emit('agent/release')
    const refusedAgain = next(other, 'unauthorized')
    other.emit('authentication', attempt)
    await refusedAgain
    expect(signOut).not.toHaveBeenCalled()

    checkSignIn.mockRestore()
    Object.assign(cli.data, { admin: undefined })
  })

  it('accepts sockets only from the app origin', async () => {
    const checkSignIn = jest.spyOn(user, 'checkSignIn')
    const before = io.sockets.sockets.size
    for (const origin of ['https://evil.example', `http://attacker.example:${WEB_PORT}`, 'null']) {
      const socket = dial(origin)
      const answer = Promise.race(['connect', 'connect_error'].map(event => next(socket, event).then(() => event)))
      socket.emit('authentication', { username: 'b@test', authHash: 'hash-b', guid: 'guid-b' })
      expect(await answer).toBe('connect_error')
    }
    expect(io.sockets.sockets.size).toBe(before)
    expect(checkSignIn).not.toHaveBeenCalled()
    checkSignIn.mockRestore()

    Object.assign(user, credentials)
    expect(await authenticate(await open(`https://localhost:${SSL_PORT}`), credentials)).toBe('authenticated')
  })

  it('allowlists the origin by hostname and port', () => {
    expect(isSocketOrigin(appOrigin)).toBe(true)
    expect(isSocketOrigin(`http://localhost:${WEB_PORT}`)).toBe(true)
    expect(isSocketOrigin(`http://[::1]:${WEB_PORT}`)).toBe(true)
    expect(isSocketOrigin(`https://127.0.0.1:${SSL_PORT}`)).toBe(true)
    expect(isSocketOrigin(`https://127.0.0.1:${WEB_PORT}`)).toBe(false)
    expect(isSocketOrigin('http://127.0.0.1:8080')).toBe(false)
    expect(isSocketOrigin(`http://127.0.0.1.attacker.example:${WEB_PORT}`)).toBe(false)
    expect(isSocketOrigin(undefined)).toBe(false)
    expect(isSocketOrigin('null')).toBe(false)
  })

  it('ignores commands from a socket that has signed out', async () => {
    Object.assign(user, credentials)
    const window = await open()
    expect(await authenticate(window, credentials)).toBe('authenticated')
    const signedOut = next(window, User.EVENTS.signedOut)
    window.emit('user/sign-out')
    await signedOut

    nextFreePort.mockClear()
    const heard = listen(window)
    window.emit('freePort')
    // Packets from one socket are handled in order, so the release's answer comes after freePort was handled.
    expect(await window.emitWithAck('agent/release')).toBe(false)
    expect(nextFreePort).not.toHaveBeenCalled()
    expect(heard).not.toContain('freePort')
  })
})
