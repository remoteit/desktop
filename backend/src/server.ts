import debug from 'debug'
import express from 'express'
import os from 'os'
import { install } from './connectd/install'
import { watch } from './connectd/watch'
import { toPercent } from './utils/toPercent'
import { Server } from 'http'
import socketIO from 'socket.io'
import { exists, version } from './connectd/binary'
import { targetPath } from './connectd/platform'
import { LATEST_CONNECTD_RELEASE, PORT } from './constants'
import * as track from './utils/analytics'

const d = debug('r3:server')

export function server() {
  d('Starting server on port:', PORT)
  const app = express()
  const server = new Server(app)
  const io = socketIO(server)

  app.get('/', (_, res) => res.send('Hi'))

  io.on('connection', socket => {
    d('User connected to WS server')

    const routes = router(socket)

    watch()
      .on('ready', routes.watcherReady)
      .on('added', routes.connectdAdded)
      .on('updated', routes.connectdAdded)
      .on('removed', routes.connectdAdded)
      .on('error', routes.watcherReady)

    socket.on('connectd/info', routes.info)
    socket.on('connectd/install', routes.install)
    socket.on('disconnect', routes.disconnect)
  })

  server.listen(PORT, () => d(`Listening on port ${PORT}`))
}

function router(socket: SocketIO.Socket) {
  return {
    install: async () => {
      d('Starting connectd install')

      await install(LATEST_CONNECTD_RELEASE, percent => {
        d(`Progress: ${toPercent(percent)}%`)
        socket.emit('connectd/install/progress', toPercent(percent))
      })

      socket.emit('connectd/install/done', LATEST_CONNECTD_RELEASE)

      d('Install of connectd complete')

      track.event(
        'connectd',
        'install',
        'Installing connectd',
        `platform: ${os.platform()}, architecture: ${os.arch()}`
      )
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
    disconnect: () => d('User disconnected from WS server'),
    watcherReady: () => socket.emit('connectd/file/watching'),
    connectdAdded: (file: string) => socket.emit('connectd/file/added', file),
    connectdUpdated: (file: string) =>
      socket.emit('connectd/file/updated', file),
    connectdRemoved: (file: string) =>
      socket.emit('connectd/file/removed', file),
    watcherError: (error: Error) => socket.emit('connectd/file/error', error),
  }
}
