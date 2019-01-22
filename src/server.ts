import express from 'express'
import debug from 'debug'
import https from 'https'
import io, { Socket } from 'socket.io'
// import PeerConnection from './models/peer-connection'
import { EVENTS, CERT_FILE, KEY_FILE, PORT } from './constants'
import ConnectionPool from './models/connection-pool'
import Connection, { ConnectionData } from './models/connection'
import track from './services/track'

const d = debug('desktop:server')

export default function createServer() {
  const app = express()
  const server = https.createServer({ key: KEY_FILE, cert: CERT_FILE }, app)
  const socket = io(server)

  track
    .event('server', 'started', 'WebSocket server started at port', PORT)
    .send()

  app.get('/', (req, res) =>
    res.json({ message: 'Please visit app.remote.it!' })
  )

  const pool = new ConnectionPool()

  socket.on(EVENTS.client.connection, (s: Socket) => {
    d('Client connected')
    track
      .event('server', 'connected to server', 'WebSocket client connected')
      .send()

    s.use(authMiddleware(pool, s))
    s.on(EVENTS.client.disconnect, clientDisconnect())
    s.on(EVENTS.services.connect, serviceConnect(pool, s))
    s.on(EVENTS.services.disconnect, serviceDisconnect(pool))
    s.on(EVENTS.services.disconnectAll, serviceDisconnectAll(pool))
    s.on(EVENTS.services.list, serviceList(pool))
  })

  server.listen(PORT, () => d('Listening on port', PORT))
}

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
      s.emit(EVENTS.client.unauthorized)
      return
    }

    s.emit(EVENTS.client.authorized, {
      username,
      connections: pool.connections,
    })
    next()
  }
}

function clientDisconnect() {
  return () => d('Client disconnected')
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

    conn.on(EVENTS.services.connected, () => {
      s.emit(EVENTS.services.connected, conn.toJSON())
    })

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
