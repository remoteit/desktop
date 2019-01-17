import debug from 'debug'
// import Proxy from './proxy'
import httpProxy from 'http-proxy'

const d = debug('desktop:models:local-proxy')

type Options = {
  localPort: number
  remotePort: number
  remoteAddress: string
}
export default class LocalProxy {
  public localPort: number
  public remoteAddress: string
  public remotePort: number
  // public proxy: Proxy
  public proxy: httpProxy

  constructor({ localPort, remoteAddress, remotePort }: Options) {
    d('[LocalProxy.constructor] Creating LocalProxy:', {
      localPort,
      remoteAddress,
      remotePort,
    })

    this.localPort = localPort
    this.remoteAddress = remoteAddress
    this.remotePort = remotePort

    // this.proxy = new Proxy({ localPort, remoteAddress, remotePort })
    this.proxy = httpProxy
      .createProxyServer({ target: `http://${remoteAddress}:${remotePort}` })
      .listen(localPort)
  }
}
