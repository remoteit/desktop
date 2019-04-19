import debug from 'debug'
import express from 'express'
import { install } from './connectd/install'
import { watch } from './connectd/watch'
import { toPercent } from './utils/toPercent'
import { Server } from 'http'
import socketIO from 'socket.io'
import { exists, version } from './connectd/binary'
import { targetPath } from './connectd/platform'
import { LATEST_CONNECTD_RELEASE, PORT } from './constants'

const d = debug('r3:server')

export function server() {
  d('Starting server on port:', PORT)
  const app = express()
  const server = new Server(app)
  const io = socketIO(server)

  app.get('/', (_, res) => res.send('Hi'))

  io.on('connection', socket => {
    d('User connected to WS server')

    watch()
      .on('ready', () => socket.emit('connectd/file/watching'))
      .on('added', file => socket.emit('connectd/file/added', file))
      .on('updated', file => socket.emit('connectd/file/updated', file))
      .on('removed', file => socket.emit('connectd/file/removed', file))
      .on('error', error => socket.emit('connectd/file/error', error))

    socket.on('connectd/info', routes.info())
    socket.on('connectd/install', routes.install(socket))
    socket.on('disconnect', routes.disconnect())
  })

  server.listen(PORT, () => d(`Listening on port ${PORT}`))
}

const routes = {
  install(socket: socketIO.Socket) {
    return async () => {
      d('Starting connectd install')

      await install(LATEST_CONNECTD_RELEASE, percent => {
        d(`Progress: ${toPercent(percent)}%`)
        socket.emit('connectd/install/progress', toPercent(percent))
      })

      socket.emit('connectd/install/done', LATEST_CONNECTD_RELEASE)

      d('Install of connectd complete')
    }
  },
  info() {
    return (callback: (data: any) => void) =>
      callback({ exists: exists(), path: targetPath(), version: version() })
  },
  disconnect() {
    return () => d('User disconnected from WS server')
  },
}
