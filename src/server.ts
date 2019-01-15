import cors from 'cors'
import debug from 'debug'
import express from '@feathersjs/express'
import feathers from '@feathersjs/feathers'
import https from 'https'
import io from '@feathersjs/socketio'
import middleware from './middleware'
import services from './services'
import { CERT_FILE, KEY_FILE } from './constants'

debug('desktop:server')('Creating server!')

const app = express(feathers())
const server = https.createServer({ key: KEY_FILE, cert: CERT_FILE }, app)

app.configure(io())
app.use(cors())
app.setup(server)
app.configure(middleware)
app.configure(services)
app.use(express.notFound())
app.use(express.errorHandler())

export default server
