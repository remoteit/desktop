import debug from 'debug'
import freePort from '../utils/free-port'
import LocalProxy from './local-proxy'
import PeerConnection from './peer-connection'
import Service from './service'
import { PEER_PORT_RANGE, PROXY_PORT_RANGE } from '../constants'

const d = debug('desktop:models:connection')

// Store the last assigned port so there are no race conditions
// assigning ports before a listener is ready.
let startingPeerPort = PEER_PORT_RANGE[0]
let startingProxyPort = PROXY_PORT_RANGE[0]

type Options = {
  service: Service
  subdomain?: string
}

export interface ConnectionData {
  host: string
  proxyPort?: number
  peerPort?: number
  hostname: string
  subdomain?: string
  serviceID: string
}

export default class Connection implements ConnectionData {
  public proxyPort?: number
  public peerPort?: number
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
    d('Creating connection:', opts)
  }

  public async start() {
    const [peerPort, proxyPort] = await Promise.all([
      freePort(startingPeerPort, PEER_PORT_RANGE[1]),
      freePort(startingProxyPort, PROXY_PORT_RANGE[1]),
    ])

    d('Assigned ports to connection:', { peerPort, proxyPort })

    // Save the port
    this.peerPort = peerPort
    this.proxyPort = proxyPort
    startingPeerPort = peerPort + 1
    startingProxyPort = proxyPort + 1

    this.proxy = new LocalProxy({
      localPort: proxyPort,
      remotePort: peerPort,
      remoteAddress: '127.0.0.1',
    })
    d('Created local reverse proxy at:', {
      proxyPort,
      peerPort,
      serviceID: this.serviceID,
    })

    // Create a P2P connection then proxy requests to it.
    this.peer = new PeerConnection({
      port: peerPort,
      serviceID: this.serviceID,
    })

    // Wait till connections establish before returning
    await Promise.all([this.peer.start()])
    d('Created P2P connection at:', { peerPort, serviceID: this.serviceID })

    d('Started connection:', {
      proxyPort: this.proxyPort,
      peerPort: this.peerPort,
      subdomain: this.subdomain,
      serviceID: this.serviceID,
    })
  }

  public get host() {
    return `${this.subdomain}.desktop.rt3.io`
  }

  public toJSON(): ConnectionData {
    return {
      peerPort: this.peerPort,
      proxyPort: this.proxyPort,
      hostname: this.hostname,
      serviceID: this.service.id,
      subdomain: this.subdomain,
      host: this.host,
    }
  }
}
