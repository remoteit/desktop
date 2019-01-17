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

app
  .configure(io())
  .use(cors())
  .configure(middleware)
  .configure(services)
  // .get('*', (req, res, next) => {
  //   const sub = req.subdomains[1]
  //   if (!sub) return next()
  //   const conn = req.app.
  //   res.send(sub)
  // })
  .use(express.notFound())
  .use(express.errorHandler())

app.setup(server) // keep at the end

export default server
