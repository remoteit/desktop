import debug from 'debug'
import freePort from '../utils/free-port'
import LocalProxy from './local-proxy'
import { PeerConnection } from './peer-connection'
import Service from './service'
import { PEER_PORT_RANGE, PROXY_PORT_RANGE } from '../constants'
import { EventEmitter } from 'events'
import { map } from 'lodash'

const d = debug('desktop:models:connection')

// Store the last assigned port so there are no race conditions
// assigning ports before a listener is ready.
let startingPeerPort = PEER_PORT_RANGE[0]
let startingProxyPort = PROXY_PORT_RANGE[0]

interface ConnectionOptions {
  authHash: string
  service: Service
  deviceID: string
  subdomain?: string
  username: string
}

export interface ConnectionData {
  authHash?: string
  deviceID: string
  host?: string
  proxyPort?: number
  peerPort?: number
  hostname?: string
  subdomain?: string
  serviceID: string
  username: string
}

export default class Connection extends EventEmitter implements ConnectionData {
  public authHash: string
  public deviceID: string
  public hostname: string = 'localhost'
  public proxyPort?: number
  public peerPort?: number
  public service: Service
  public serviceID: string
  public subdomain?: string
  public username: string
  private proxy?: LocalProxy
  private peer?: PeerConnection

  constructor(opts: ConnectionOptions) {
    super()
    this.service = opts.service
    this.subdomain = opts.subdomain
    this.serviceID = opts.service.id
    this.deviceID = opts.deviceID
    this.authHash = opts.authHash
    this.username = opts.username

    d('Creating connection: %o', opts)
  }

  /**
   * Start the connection. Attempts to create a Peer-to-Peer
   * connection and falls back to a proxy connection if that fails.
   *
   * Reports state of the connection using standard events.
   */
  public connect = async () => {
    const [peerPort, proxyPort] = await this.getAvailablePorts()
    this.peerPort = peerPort
    this.proxyPort = proxyPort

    this.proxy = this.createLocalProxy(peerPort, proxyPort)

    this.peer = new PeerConnection({
      authHash: this.authHash,
      username: this.username,
      port: peerPort,
      serviceID: this.serviceID,
    })

    if (this.peer) {
      this.forwardPeerConnectionMessages(this.peer)
    }

    await this.peer.connect()

    d('Started peer connection: %o', this.peer.toJSON())
  }

  public async disconnect() {
    if (!this.peer) return
    this.peer.disconnect()
  }

  /**
   * Get the host of the connection using the assigned subdomain
   * which is used as the default URL for connections.
   */
  public get host() {
    return `${this.subdomain}.desktop.rt3.io`
  }

  public toJSON(): ConnectionData {
    return {
      deviceID: this.deviceID,
      host: this.host,
      hostname: this.hostname,
      peerPort: this.peerPort,
      proxyPort: this.proxyPort,
      serviceID: this.service.id,
      subdomain: this.subdomain,
      username: this.username,
    }
  }

  /**
   * Forward all connectd P2P events so the consumercan act on them.
   */
  private forwardPeerConnectionMessages(peer: PeerConnection) {
    map(PeerConnection.EVENTS, type => {
      peer.on(type, payload => {
        this.emit(type, payload)
      })
    })
  }

  private async getAvailablePorts() {
    const [peerPort, proxyPort] = await Promise.all([
      freePort(startingPeerPort, PEER_PORT_RANGE[1]),
      freePort(startingProxyPort, PROXY_PORT_RANGE[1]),
    ])

    d('Assigned ports to connection: %o', { peerPort, proxyPort })

    // Save the port we are using so we can not have to
    // iterate over every single port, just increment from the beginning
    // Note: only time this should be a problem if we exhaust ports
    // in this range, but that is 10,000 TCP ports, which is highly
    // unlikely.
    startingPeerPort = peerPort + 1
    startingProxyPort = proxyPort + 1

    return [peerPort, proxyPort]
  }

  private createLocalProxy(peerPort: number, proxyPort: number) {
    const proxy = new LocalProxy({
      localPort: proxyPort,
      remotePort: peerPort,
      remoteAddress: '127.0.0.1',
    })
    d('Created local reverse proxy: %o', this.toJSON())
    return proxy
  }
}
