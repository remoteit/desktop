import debug from 'debug'
// import http from 'http'
// import net from 'net'
import httpProxy from 'http-proxy'
// import url from 'url'
// import util from 'util'
// var proxy = httpProxy.createServer();

const d = debug('desktop:models:local-proxy')

type Options = {
  port: number
  target: string
}

export default class LocalProxy {
  public port: number
  public target: string
  private proxy: httpProxy

  constructor(opts: Options) {
    this.port = opts.port
    this.target = opts.target

    d('[LocalProxy.constructor] Creating local proxy:', opts)

    this.proxy = httpProxy
      .createProxyServer({ target: this.target })
      .listen(this.port)

    // this.proxy = httpProxy.createServer()
    // const server = http
    //   .createServer((req, res) => {
    //     util.puts('Receiving reverse proxy request for:' + req.url)
    //     this.proxy.web(req, res, { target: req.url, secure: false })
    //   })
    //   .listen(this.port)

    // server.on('connect', (req, socket) => {
    //   util.puts('Receiving reverse proxy request for:' + req.url)

    //   const serverUrl = url.parse('https://' + req.url)

    //   const srvSocket = net.connect(
    //     Number(serverUrl.port),
    //     serverUrl.hostname,
    //     () => {
    //       socket.write(
    //         'HTTP/1.1 200 Connection Established\r\n' +
    //           'Proxy-agent: Node-Proxy\r\n' +
    //           '\r\n'
    //       )
    //       srvSocket.pipe(socket)
    //       socket.pipe(srvSocket)
    //     }
    //   )
    // })
  }
}
