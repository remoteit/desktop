import net from 'net'

type Options = {
  localPort: number
  remoteAddress: string
  remotePort: number
}

export default class Proxy {
  public localPort: number
  public remotePort: number
  public remoteAddress: string
  public proxy: net.Server

  constructor({ localPort, remoteAddress, remotePort }: Options) {
    this.localPort = localPort
    this.remoteAddress = remoteAddress
    this.remotePort = remotePort

    this.proxy = net.createServer(socket => {
      socket.on('data', msg => {
        const serviceSocket = new net.Socket()
        serviceSocket.connect(
          this.remotePort,
          this.remoteAddress,
          () => serviceSocket.write(msg)
        )
        serviceSocket.on('data', data => socket.write(data))
      })
    })

    // Listen to connections on the local port and forward
    // packets to the remote.
    this.proxy.listen(this.localPort)
  }
}
