import debug from 'debug'
import electron from 'electron'
import express from 'express'
import socketIO from 'socket.io'
import { Server } from 'http'
import { PORT } from './constants'
import { routes } from './routes'
import { watcher } from './routes/watcher'
import { EVENTS } from './connectd/connection'
import ConnectionPool from './connectd/ConnectionPool'
import logger from './utils/logger'

const d = debug('r3:desktop:backend:server')

export function server(): Promise<socketIO.Server> {
  return new Promise(success => {
    d('Starting server on port:', PORT)
    logger.info('Starting server on port:', PORT)

    const app = express()
    const server = new Server(app)
    const io = socketIO(server)

    app.get('/', (_, res) =>
      res.send('Hi! You probably should not be here, but welcome anyways!')
    )

    io.on('connection', socket => {
      d('User connected to WS server')
      logger.info('User connected to WebSocket server')

      // Watch for changes to the connectd file and report those to the UI
      watcher(socket)

      // Setup the routes by mapping over them to build
      // the proper event listeners.
      handleIncomingMessages(socket)

      // Forward all events to the browser
      forwardConnectdStatusMessages(socket)
    })

    server.listen(PORT, () => {
      d(`Listening on port ${PORT}`)
      logger.info(`Listening on port ${PORT}`)
      success(io)
    })
  })
}

/**
 * Handle incoming socket messages from connected clients and
 * setup the route listeners for the messages to their
 * appropriate functions.
 */
function handleIncomingMessages(socket: socketIO.Socket) {
  Object.keys(routes).map((path: string) =>
    socket.on(path, routes[path]({ socket }))
  )
}

/**
 * Take messages that are emitted from the connectd child process
 * and forward them to any socket listeners so they can display and
 * react when connectd state changes.
 */
function forwardConnectdStatusMessages(socket: socketIO.Socket) {
  d(
    'Forwarding connectd status messages from Pool:',
    ConnectionPool.pool.length
  )
  ConnectionPool.processes.map(connection =>
    Object.values(EVENTS).map(event => {
      connection.on(event, (payload: any) => socket.emit(event, payload))
    })
  )
}
