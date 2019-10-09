// import { io } from './server'
import socketIO from 'socket.io'
import { ITarget, IDevice } from './common-copy/types'
import cli from './cli'
import lan from './lan'

class Controller {
  server: socketIO.Server

  constructor(server: socketIO.Server, socket: socketIO.Socket) {
    this.server = server

    socket.on('jump/init', this.emitAll)

    socket.on('jump/targets', (result: ITarget[]) => {
      cli.set('targets', result)
      server.emit('jump/targets', cli.data.targets)
    })

    socket.on('jump/device', (result: IDevice) => {
      cli.set('device', result)
      server.emit('jump/device', cli.data.device)
    })

    socket.on('jump/scan', async (interfaceName: string) => {
      await lan.scan(interfaceName)
      server.emit('jump/scan', lan.data)
    })

    socket.on('jump/interfaces', async () => {
      await lan.getInterfaces()
      server.emit('jump/interfaces', lan.interfaces)
    })
  }

  emitAll() {
    this.server.emit('jump/targets', cli.data.targets)
    this.server.emit('jump/device', cli.data.device)
    this.server.emit('jump/scan', lan.data)
    this.server.emit('jump/interfaces', lan.interfaces)
  }
}

export default Controller
