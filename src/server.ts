import express, { Application } from 'express'
import debug from 'debug'
import https from 'https'
import io, { Socket } from 'socket.io'
import { CERT_FILE, KEY_FILE, PORT } from './constants'
import ConnectionPool from './models/connection-pool'
import Connection, { ConnectionData } from './models/connection'
import track from './services/track'
import { PeerConnection } from './models/peer-connection'
import { map } from 'lodash'

const d = debug('desktop:server')

export class Server {
  private app: Application
  private server: https.Server
  private socket: io.Server
  private pool: ConnectionPool
  private username?: string
  private authHash?: string
  public static EVENTS = {
    authenticate: 'authenticate',
    authorized: 'authorized',
    unauthorized: 'unauthorized',
    connection: 'connection',
    disconnect: 'disconnect',
  }
  public static ACTIONS = {
    connect: 'connection:connect',
    disconnect: 'connection:disconnect',
    disconnectAll: 'connection:disconnect:all',
    list: 'connection:list',
  }

  constructor() {
    this.app = express()
    this.server = https.createServer(
      { key: KEY_FILE, cert: CERT_FILE },
      this.app
    )
    this.socket = io(this.server)

    track
      .event('server', 'started', 'WebSocket server started at port', PORT)
      .send()

    this.app.get('/', (req, res) => res.send('Please visit app.remote.it!'))

    this.pool = new ConnectionPool()

    this.socket.on(Server.EVENTS.connection, (s: Socket) => {
      d('Client connected')
      track
        .event('server', 'connected to server', 'WebSocket client connected')
        .send()

      s.use(this.authMiddleware)
      s.on(Server.EVENTS.disconnect, this.clientDisconnect)
      s.on(Server.ACTIONS.connect, this.serviceConnect)
      s.on(Server.ACTIONS.disconnect, this.serviceDisconnect)
      s.on(Server.ACTIONS.disconnectAll, this.serviceDisconnectAll)
      s.on(Server.ACTIONS.list, this.serviceList)
    })

    this.server.listen(PORT, () => d('Listening on port', PORT))
  }

  private authMiddleware = (packet: io.Packet, next: (err?: any) => void) => {
    d('Received packet: %o', packet)

    // Store user's authentication for future requests.
    if (packet[0] === Server.EVENTS.authenticate) {
      this.username = packet[1].username
      this.authHash = packet[1].authHash
    }

    track.set('uid', this.username)

    if (!this.username || !this.authHash) {
      next(new Error('not authorized'))
      this.socket.emit(Server.EVENTS.unauthorized)
      return
    }

    this.socket.emit(Server.EVENTS.authorized, {
      username: this.username,
      connections: this.pool.connections,
    })
    next()
  }

  private serviceConnect = async (
    serviceID: string,
    cb?: (conn: ConnectionData) => void
  ) => {
    track
      .event(
        'server',
        'connected to service',
        'Service connection created',
        serviceID
      )
      .send()
    d('Connect to service:', serviceID)

    try {
      const conn = await this.pool.register({ serviceID })
      d('Created connection: %o', conn.toJSON())

      map(PeerConnection.EVENTS, event => {
        d('Listing for PeerConnection event:', event)
        conn.on(event, (payload = {}) => {
          d('Received event:', event)
          this.socket.emit(event, { ...payload, connection: conn })
        })
      })

      await conn.connect()

      if (cb) cb(conn.toJSON())
    } catch (error) {
      d('Error connecting: %o', error)
      this.socket.emit('error', error.message)
    }
  }

  private serviceDisconnect = (
    serviceID: string,
    cb?: (success: boolean) => void
  ) => {
    d('Disconnecting from service:', serviceID)
    const success = this.pool.disconnect(serviceID)
    d('Removed service successfully?', success)
    if (cb) cb(success)
  }

  private clientDisconnect = () => {
    d('Client disconnected')
  }

  private serviceDisconnectAll = (cb?: (success: boolean) => void) => {
    d('Disconnecting from all services')
    const success = this.pool.disconnectAll()
    if (cb) cb(success)
  }

  private serviceList = (cb?: (connections: Connection[]) => void) => {
    d('Fetching all connections')
    if (cb) cb(this.pool.connections)
  }
}

/*
export default function createServer() {
  const app = express()
  const server = https.createServer({ key: KEY_FILE, cert: CERT_FILE }, app)
  const socket = io(server)

  track
    .event('server', 'started', 'WebSocket server started at port', PORT)
    .send()

  app.get('/', (req, res) => res.send('Please visit app.remote.it!'))

  const pool = new ConnectionPool()

  socket.on(EVENTS.client.connection, (s: Socket) => {
    d('Client connected')
    track
      .event('server', 'connected to server', 'WebSocket client connected')
      .send()

    s.use(authMiddleware(pool, s))
    s.on(EVENTS.client.disconnect, clientDisconnect())
    s.on(PeerConnection.EVENTS.connect, serviceConnect(pool, s))
    s.on(EVENTS.services.disconnect, serviceDisconnect(pool))
    s.on(EVENTS.services.disconnectAll, serviceDisconnectAll(pool))
    s.on(EVENTS.services.list, serviceList(pool))
  })

  server.listen(PORT, () => d('Listening on port', PORT))

  function authMiddleware(pool: ConnectionPool, s: io.Socket) {
    let username: string
    let authHash: string
    return (packet: io.Packet, next: (err?: any) => void) => {
      d('Received packet: %o', packet)

      // Store user's authentication for future requests.
      if (packet[0] === EVENTS.client.authenticate) {
        username = packet[1].username
        authHash = packet[1].authHash
      }

      track.set('uid', username)

      if (!username || !authHash) {
        next(new Error('not authorized'))
        // s.emit(EVENTS.client.unauthorized)
        socket.emit(EVENTS.client.unauthorized)
        return
      }

      // s.emit(EVENTS.client.authorized, {
      //   username,
      //   connections: pool.connections,
      // })
      socket.emit(EVENTS.client.authorized, {
        username,
        connections: pool.connections,
      })
      next()
    }
  }

  function clientDisconnect() {
    return () => d('Client disconnected')
  }

  function relayEvent(message: string, conn: Connection) {
    conn.on(message, () => {
      // s.emit(message, conn.toJSON())
      socket.emit(message, conn.toJSON())
    })
  }

  function serviceConnect(pool: ConnectionPool, s: io.Socket) {
    return async (serviceID: string, cb?: (conn: ConnectionData) => void) => {
      track
        .event(
          'server',
          'connected to service',
          'Service connection created',
          serviceID
        )
        .send()
      d('Connect to service:', serviceID)

      const conn = await pool.register({ serviceID })

      d('Created connection: %o', conn.toJSON())

      map(PeerConnection.EVENTS, type => {

      })
      // relayEvent(EVENTS.services.connected, conn)
      // relayEvent(EVENTS.services.disconnected, conn)
      // relayEvent(EVENTS.services.tunnelOpened, conn)
      // relayEvent(EVENTS.services.tunnelClosed, conn)

      await conn.connect()

      if (cb) cb(conn.toJSON())
    }
  }

  function serviceDisconnect(pool: ConnectionPool) {
    return (serviceID: string, cb?: (success: boolean) => void) => {
      d('Disconnecting from service:', serviceID)
      const success = pool.disconnect(serviceID)
      d('Removed service successfully?', success)
      if (cb) cb(success)
    }
  }

  function serviceDisconnectAll(pool: ConnectionPool) {
    return (cb?: (success: boolean) => void) => {
      d('Disconnecting from all services')
      const success = pool.disconnectAll()
      if (cb) cb(success)
    }
  }

  function serviceList(pool: ConnectionPool) {
    return (cb?: (connections: Connection[]) => void) => {
      d('Fetching all connections')
      if (cb) cb(pool.connections)
    }
  }
}
*/

/*
import cors from 'cors'
import debug from 'debug'
import express from '@feathersjs/express'
import feathers from '@feathersjs/feathers'
import https from 'https'
import io from '@feathersjs/socketio'
import middleware from './middleware'
import services from './services'
import subdomainProxy from './middleware/subdomain-proxy'
import { CERT_FILE, KEY_FILE } from './constants'

debug('desktop:server')('Creating server!')

const app = express(feathers())
const server = https.createServer({ key: KEY_FILE, cert: CERT_FILE }, app)

app
  .configure(io())
  .use(cors())
  .get('/', (req, res) => res.json('hi'))
  .configure(middleware)
  .configure(services)
  .use(subdomainProxy)
  .use(express.notFound())
  .use(express.errorHandler())

app.setup(server) // keep at the end

export default server
*/
