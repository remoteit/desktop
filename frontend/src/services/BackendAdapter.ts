import io from 'socket.io-client'
import { store } from '../store'
import { PORT } from '../constants'
import { EventEmitter } from 'events'
import { IUser } from 'remote.it'

class BackendAdapter extends EventEmitter {
  private socket = io(`http://localhost:${PORT}`)

  constructor(handlers: EventHandlers) {
    super()

    for (const eventName in handlers) {
      if (handlers.hasOwnProperty(eventName)) {
        const name = eventName as SocketEvent
        const handler = handlers[name]
        this.on(name, handler)
      }
    }
  }

  on(eventName: SocketEvent, handler: (...args: any[]) => void) {
    this.socket.on(eventName, handler)
    return this
  }

  off(eventName: SocketEvent) {
    this.socket.off(eventName)
    return this
  }

  emit(event: SocketAction, ...args: any[]): boolean {
    this.socket.emit(event, ...args)
    return true
  }
}

type EventHandlers = { [event in SocketEvent]: (data?: any) => any }

const { devices, binaries, auth, jump } = store.dispatch

const handlers: EventHandlers = {
  connect: () => store.dispatch.ui.connected(),
  disconnect: () => store.dispatch.ui.disconnected(),
  connect_error: () => jump.setError(true),

  // Connections
  'pool/updated': (connections: IConnection[]) => {
    console.log('socket connections', connections)
    if (connections) jump.setConnections(connections)
  },
  'service/started': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/started', ...msg }), /// devices.connectStart(conn.id)
  'service/connected': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/connected', ...msg }), ///  devices.connected(msg.connection)
  'service/disconnected': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/disconnected', ...msg }), ///  devices.disconnected(msg)
  'service/forgotten': (id: string) => jump.setConnection({ event: 'service/forgotten', id }), // / devices.forgotten(id)
  'service/error': (msg: ConnectionErrorMessage) => jump.setConnection({ event: 'service/error', ...msg }), /// devices.connectionError(msg)
  'service/status': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/status', ...msg }),
  'service/uptime': (msg: ConnectdMessage) => {}, // jump.setConnection({event: 'service/uptime', ...msg}),
  'service/request': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/request', ...msg }),
  'service/tunnel/opened': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/tunnel/opened', ...msg }),
  'service/tunnel/closed': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/tunnel/closed', ...msg }),
  'service/throughput': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/throughput', ...msg }),
  'service/version': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/version', ...msg }),
  'service/unknown-event': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/unknown-event', ...msg }),
  'service/connecting': (msg: ConnectdMessage) => jump.setConnection({ event: 'service/connecting', ...msg }),
  // 'service/updated': (msg: ConnectdMessage) => jump.setConnection({event: 'service/updated', ...msg}),

  // muxer binary
  'binary/install/start': () => console.log('binary/install/start'),
  'binary/install/error': (error: string) => binaries.installError(error),
  'binary/install/progress': (progress: number) => console.log('binary/install/progress', progress),
  'binary/installed': (info: InstallationInfo) => binaries.installed(info),
  'binary/not-installed': (binary: string) => binaries.notInstalled(binary),

  // User/auth
  'user/sign-in/error': (error: string) => auth.signInError(error),
  'user/signed-out': () => auth.signedOut(),
  'user/signed-in': (user: IUser) => auth.signedIn(user),

  // jump
  'jump/targets': (result: ITarget[]) => {
    console.log('socket targets', result)
    if (result) {
      jump.setAdded(undefined)
      jump.setTargets(result)
    }
  },
  'jump/device': (result: IDevice) => {
    console.log('socket device', result)
    if (result) jump.setDevice(result)
  },
  'jump/scan': (result: IScanData) => {
    console.log('socket scan', result)
    if (result) jump.setScanData(result)
  },
  'jump/interfaces': (result: IInterface[]) => {
    console.log('socket interfaces', result)
    if (result) jump.setInterfaces(result)
  },
}

export default new BackendAdapter(handlers)
