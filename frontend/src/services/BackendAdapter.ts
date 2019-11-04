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
  'service/connect/started': (conn: ConnectionInfo) => devices.connectStart(conn.id),
  'service/connected': (msg: ConnectdMessage) => devices.connected(msg.connection),
  'service/disconnected': (msg: ConnectdMessage) => devices.disconnected(msg),
  'service/tunnel/opened': (msg: ConnectdMessage) => console.log('service/tunnel/opened', msg),
  'service/tunnel/closed': (msg: ConnectdMessage) => console.log('service/tunnel/closed', msg),
  'service/error': (msg: ConnectionErrorMessage) => devices.connectionError(msg),
  'service/status': (msg: ConnectdMessage) => console.log('service/status', msg),
  'service/forgotten': (id: string) => devices.forgotten(id),
  // 'service/updated': (msg: ConnectdMessage) =>
  //   console.log('service/updated', msg),
  'service/request': (msg: ConnectdMessage) => console.log('service/request', msg),
  'service/connecting': (msg: ConnectdMessage) => console.log('service/connecting', msg),
  'service/unknown-event': (msg: ConnectdMessage) => console.log('service/unknown-event', msg),
  'service/throughput': (msg: ConnectdMessage) => console.log('service/throughput', msg),
  'service/version': (msg: ConnectdMessage) => console.log('service/version', msg),
  'service/uptime': (msg: ConnectdMessage) => {},
  // console.log('service/uptime', msg),

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
