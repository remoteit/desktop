import fs from 'fs'
import path from 'path'
import io from 'socket.io'
import https from 'https'
import cors from 'cors'
import express from 'express'
import Connectd from './connectd'
// import HostsFile from './hosts-file'
// import Platform from './platform'

const DEFAULT_PORT = 443
const connections: Connectd[] = []

export default class Server {
  port: number
  app: express.Application
  server: https.Server
  socket: io.Server

  constructor(port = DEFAULT_PORT) {
    this.port = port
    this.app = express()

    this.server = https.createServer(
      {
        key: fs.readFileSync(
          path.join(__dirname, '../cert/desktop.rt3.io.key')
        ),
        cert: fs.readFileSync(path.join(__dirname, '../cert/fullchain.cer')),
      },
      this.app
    )

    this.socket = io(this.server)

    this.setupMiddleware()
    this.setupRoutes()
    this.start()
  }

  setupMiddleware = () => {
    this.app.use(cors())
  }

  setupRoutes = () => {
    this.socket.on('connection', (socket: io.Server) => {
      console.log('[Server] New WebSocket connection!')
      socket.emit('connections', connections)
      socket.on('services/connect', this.handleConnection)
    })
  }

  handleConnection = (serviceID: string) => {
    console.log('[Server.setupRoutes] Connecting to service:', serviceID)

    // If a connection already exists, ignore the request
    const existing = connections.find(c => c.serviceID === serviceID)
    if (existing) {
      console.log(
        '[Server.setupRoutes] Service already connected, ignoring:',
        serviceID
      )
      return
    }

    const connection = new Connectd(serviceID)
    connection.on('log', log => this.socket.emit('log', log))
    connections.push(connection)
  }

  start = () => {
    this.server.listen(this.port, () =>
      console.log(`Example app listening on port ${this.port}!`)
    )
  }
}
