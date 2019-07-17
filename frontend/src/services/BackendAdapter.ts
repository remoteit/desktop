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
  'pool/updated': (pool: ConnectionInfo[]) => console.log('pool/updated', pool),
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

  // General install
  'install/error': error => store.dispatch.binaries.installError(error),

  // connectd binary
  'connectd/install/start': () => console.log('connectd/install/start'),
  'connectd/install/error': () => console.log('connectd/install/error'),
  'connectd/install/progress': () => console.log('connectd/install/progress'),
  'connectd/installed': (info: InstallationInfo) =>
    store.dispatch.binaries.installed({ binary: 'connectd', info }),
  'connectd/not-installed': () =>
    store.dispatch.binaries.notInstalled('connectd'),

  // muxer binary
  'muxer/install/start': () => console.log('muxer/install/start'),
  'muxer/install/error': () => console.log('muxer/install/error'),
  'muxer/install/progress': () => console.log('muxer/install/progress'),
  'muxer/installed': (info: InstallationInfo) =>
    store.dispatch.binaries.installed({ binary: 'muxer', info }),
  'muxer/not-installed': () => store.dispatch.binaries.notInstalled('muxer'),

  // demuxer binary
  'demuxer/install/start': () => console.log('demuxer/install/start'),
  'demuxer/install/error': () => console.log('demuxer/install/error'),
  'demuxer/install/progress': () => console.log('demuxer/install/progress'),
  'demuxer/installed': (info: InstallationInfo) =>
    store.dispatch.binaries.installed({ binary: 'demuxer', info }),
  'demuxer/not-installed': () =>
    store.dispatch.binaries.notInstalled('demuxer'),

  // User/auth
  'user/sign-in/error': (error: string) =>
    store.dispatch.auth.signInError(error),
  'user/signed-out': () => store.dispatch.auth.signedOut(),
  'user/signed-in': (user: IUser) => store.dispatch.auth.signedIn(user),
}

export default new BackendAdapter(handlers)
