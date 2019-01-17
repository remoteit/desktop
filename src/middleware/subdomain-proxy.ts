import debug from 'debug'
// import request from 'request'
import { pool } from '../services/connection/connection.service'
import { NextFunction } from 'connect'
import { Request, Response } from 'express'

const d = debug('desktop:middleware:subdomain-proxy')

export default async (req: Request, res: Response, next: NextFunction) => {
  // If route does not have a subdomain, just let them
  // continue.
  const sub = req.subdomains[1]
  d('Subdomain:', sub)
  if (!sub) return next()

  // Look for a P2P connection that matches the subdomain
  // and, if found, proxy their requests to it.
  // const connections = await app.service('connections').find()
  const conn = pool.connections.find(c => c.subdomain === sub)
  d('Connection found:', conn)
  if (!conn || !conn.proxy) return next()

  const url = `http://localhost:${conn.proxyPort}`
  conn.proxy.proxy.web(req, res, { target: url })
  // conn.proxy.proxy.proxy.emit('foo') //web(req, res, { target: url })
}
