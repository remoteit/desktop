import { createServer } from 'http'
import express from 'express'
import socketIO from 'socket.io'
import cors from 'cors'
import config, { getPath } from './config'

let app = express()
const server = createServer(app)
const dir = getPath('WEB')

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))

app.use(express.static(dir))

export const io = socketIO(server)

server.listen(config.SOCKET_PORT, function() {
  console.log('serving: ' + dir)
  console.log('listening on *:' + config.SOCKET_PORT)
})
