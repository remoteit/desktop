import Service from './service'
import LocalProxy from './local-proxy'
import PeerConnection from './peer-connection'

type Options = {
  port: number
  service: Service
  // subdomain?: string
}

export interface ConnectionData {
  port: number
  hostname: string
  // subdomain?: string
  serviceID: string
}

export default class Connection implements ConnectionData {
  public port: number
  public service: Service
  public serviceID: string
  // public subdomain?: string
  public hostname: string = 'localhost'
  private proxy: LocalProxy
  private peer: PeerConnection

  constructor(opts: Options) {
    this.port = opts.port
    this.service = opts.service
    // this.subdomain = opts.subdomain
    this.serviceID = opts.service.id
    this.peer = new PeerConnection({ serviceID: this.serviceID })
    this.proxy = new LocalProxy({ port: this.port, target: this.peer.url })
  }

  toJSON(): ConnectionData {
    return {
      port: this.port,
      hostname: this.hostname,
      serviceID: this.service.id,
    }
  }
}
