import Connection from './Connection'
import ConnectionPool from './ConnectionPool'
import debug from 'debug'
import EventBus from './EventBus'
import EventRelay from './EventRelay'
import express from 'express'
import path from 'path'
import Installer from './Installer'
import Logger from './Logger'
import SocketIO from 'socket.io'
import User from './User'
import { createServer } from 'http'
import { PORT } from './constants'

const d = debug('r3:backend:Server')

export default class Server {
  public io: SocketIO.Server
  static EVENTS = {
    ready: 'server/ready',
    connection: 'server/connection',
  }

  constructor() {
    const dir = path.join(__dirname, '../build')
    const app = express().use(express.static(dir))
    const server = createServer(app).listen(PORT, () => {
      d(`Listening on port ${PORT}`)
      console.log('---------------------------------------------\n\n')
      console.log('serving: ' + dir)
      console.log(`Listening on localhost:${PORT}`)
      console.log('\n\n---------------------------------------------')
      EventBus.emit(Server.EVENTS.ready)
    })

    this.io = SocketIO(server)

    new EventRelay(
      [
        ...Object.values(Connection.EVENTS),
        ...Object.values(ConnectionPool.EVENTS),
        ...Object.values(Installer.EVENTS),
        ...Object.values(User.EVENTS),
      ],
      EventBus,
      this.io.sockets
    )

    this.io.on('connection', socket => {
      Logger.info('New connection')
      EventBus.emit(Server.EVENTS.connection, socket)
    })
  }
}
