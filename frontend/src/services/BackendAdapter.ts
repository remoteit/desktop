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

const handlers: EventHandlers = {
  connect: () => store.dispatch.ui.connected(),
  disconnect: () => store.dispatch.ui.disconnected(),

  // Connections
  'service/connect/started': (conn: ConnectionInfo) =>
    store.dispatch.devices.connectStart(conn.id),
  'service/connected': (conn: ConnectionInfo) =>
    store.dispatch.devices.connected(conn),
  'service/disconnected': (msg: ConnectdMessage) =>
    store.dispatch.devices.disconnected(msg),
  'service/tunnel/opened': (msg: ConnectdMessage) =>
    console.log('service/tunnel/opened', msg),
  'service/tunnel/closed': (msg: ConnectdMessage) =>
    console.log('service/tunnel/closed', msg),
  'service/error': (msg: ConnectionErrorMessage) =>
    store.dispatch.devices.connectionError(msg),
  'service/status': (msg: ConnectdMessage) =>
    console.log('service/status', msg),
  'service/forgotten': (id: string) => store.dispatch.devices.forgotten(id),
  // 'service/updated': (msg: ConnectdMessage) =>
  //   console.log('service/updated', msg),
  'service/request': (msg: ConnectdMessage) =>
    console.log('service/request', msg),
  'service/connecting': (msg: ConnectdMessage) =>
    console.log('service/connecting', msg),
  'service/unknown-event': (msg: ConnectdMessage) =>
    console.log('service/unknown-event', msg),
  'service/throughput': (msg: ConnectdMessage) =>
    console.log('service/throughput', msg),
  'service/version': (msg: ConnectdMessage) =>
    console.log('service/version', msg),
  'service/uptime': (msg: ConnectdMessage) => {},
  // console.log('service/uptime', msg),

  // muxer binary
  'binary/install/start': () => console.log('binary/install/start'),
  'binary/install/error': (error: string) =>
    store.dispatch.binaries.installError(error),
  'binary/install/progress': (progress: number) =>
    console.log('binary/install/progress', progress),
  'binary/installed': (info: InstallationInfo) =>
    store.dispatch.binaries.installed(info),
  'binary/not-installed': (binary: string) =>
    store.dispatch.binaries.notInstalled(binary),

  // User/auth
  'user/sign-in/error': (error: string) =>
    store.dispatch.auth.signInError(error),
  'user/signed-out': () => store.dispatch.auth.signedOut(),
  'user/signed-in': (user: IUser) => store.dispatch.auth.signedIn(user),
}

export default new BackendAdapter(handlers)
