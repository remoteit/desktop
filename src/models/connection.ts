import freePort from '../utils/free-port'
import LocalProxy from './local-proxy'
import PeerConnection from './peer-connection'
import Service from './service'
import { PEER_PORT_RANGE, PROXY_PORT_RANGE } from '../constants'

type Options = {
  service: Service
  subdomain?: string
}

export interface ConnectionData {
  port?: number
  hostname: string
  subdomain?: string
  serviceID: string
}

export default class Connection implements ConnectionData {
  public port?: number
  public service: Service
  public serviceID: string
  public subdomain?: string
  public hostname: string = 'localhost'
  public proxy?: LocalProxy
  public peer?: PeerConnection

  constructor(opts: Options) {
    this.service = opts.service
    this.subdomain = opts.subdomain
    this.serviceID = opts.service.id
    this.start()
  }

  public async start() {
    const [peerPort, proxyPort] = await Promise.all([
      freePort(PEER_PORT_RANGE),
      freePort(PROXY_PORT_RANGE),
    ])
    // const peerPort = await freePort(PEER_PORT_RANGE)
    // const proxyPort = await freePort(PROXY_PORT_RANGE)
    if (!peerPort || !peerPort) throw new Error('No ports are available!')

    // Create a P2P connection then proxy requests to it.
    this.peer = new PeerConnection({
      port: peerPort,
      serviceID: this.serviceID,
    })
    this.proxy = new LocalProxy({
      localPort: proxyPort,
      remotePort: peerPort,
      remoteAddress: '127.0.0.1',
    })

    // Save the port
    this.port = proxyPort
  }

  public toJSON(): ConnectionData {
    return {
      port: this.port,
      hostname: this.hostname,
      serviceID: this.service.id,
      subdomain: this.subdomain,
    }
  }
}
