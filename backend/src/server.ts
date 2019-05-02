import debug from 'debug'
import express from 'express'
import { install } from './connectd/install'
import { watch } from './connectd/watch'
import { toPercent } from './utils/toPercent'
import { Server } from 'http'
import socketIO from 'socket.io'
import { exists, version } from './connectd/binary'
import { targetPath } from './connectd/host'
import { LATEST_CONNECTD_RELEASE, PORT, PEER_PORT_RANGE } from './constants'
import { IService, IUser } from 'remote.it'
import * as track from './utils/analytics'
import * as Pool from './connectd/pool'
import { freePort } from './utils/freePort'
import { EVENTS } from './connectd/connection'

const d = debug('r3:server')

export function server() {
  d('Starting server on port:', PORT)
  const app = express()
  const server = new Server(app)
  const io = socketIO(server)

  app.get('/', (_, res) =>
    res.send('Hi! You probably should not be here, but welcome anyways!')
  )

  io.on('connection', socket => {
    d('User connected to WS server')

    const routes = router(socket)

    watch()
      .on('ready', routes.watcherReady)
      .on('added', routes.connectdAdded)
      .on('updated', routes.connectdAdded)
      .on('removed', routes.connectdAdded)
      .on('error', routes.watcherReady)

    socket.on('connection/list', routes.list)
    socket.on('connectd/info', routes.info)
    socket.on('connectd/install', routes.install)
    socket.on('service/connect', routes.connect)
    socket.on('service/disconnect', routes.disconnect)
    socket.on('disconnect', () => d('User disconnected from WS server'))
  })

  server.listen(PORT, () => d(`Listening on port ${PORT}`))
}

function router(socket: SocketIO.Socket) {
  return {
    list: async (callback: (connections: ConnectdProcess[]) => void) => {
      d('Return list of connected services: %O', Pool.pool)
      callback(Pool.pool)
    },
    connect: async (
      { service, user }: { service: IService; user: IUser },
      callback: (connection: ConnectdProcessData) => void
    ) => {
      const port = await freePort(PEER_PORT_RANGE)
      const connection = await Pool.register({ port, service, user })

      // Forward all events to the browser
      Object.values(EVENTS).map(event => {
        connection.on(event, (payload: any) => socket.emit(event, payload))
      })

      const data = { pid: connection.pid, port, service }
      d('Created connection: %O', data)
      connection.on(EVENTS.connected, () => callback(data))
    },
    disconnect: async (
      service: IService,
      callback: (success: boolean) => void
    ) => {
      const success = Pool.disconnect(service.id)
      callback(success)
    },
    install: async () => {
      d('Starting connectd install')

      await install(LATEST_CONNECTD_RELEASE, percent => {
        d(`Progress: ${toPercent(percent)}%`)
        socket.emit('connectd/install/progress', toPercent(percent))
      })

      socket.emit('connectd/install/done', LATEST_CONNECTD_RELEASE)

      d('Install of connectd complete')

      track.event('connectd', 'install', 'Installing connectd')
    },
    info: (callback: (data: any) => void) => {
      const params = {
        exists: exists(),
        path: targetPath(),
        version: version(),
      }
      callback(params)

      // track.event(
      //   'connectd',
      //   'info',
      //   'Retrieved connectd info',
      //   `exists: ${params.exists}, path: ${params.path}, version: ${
      //     params.version
      //   }`
      // )
    },
    watcherReady: () => socket.emit('connectd/file/watching'),
    connectdAdded: (file: string) => socket.emit('connectd/file/added', file),
    connectdUpdated: (file: string) =>
      socket.emit('connectd/file/updated', file),
    connectdRemoved: (file: string) =>
      socket.emit('connectd/file/removed', file),
    watcherError: (error: Error) => socket.emit('connectd/file/error', error),
  }
}
