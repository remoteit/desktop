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
        const handle = handlers[eventName]
        this.socket.on(eventName, handle)
      }
    }
  }

  public emit(event: string, ...args: any[]): boolean {
    this.socket.emit(event, ...args)
    return true
  }
}

interface EventHandlers {
  [name: string]: (data?: any) => any
}

const handlers: EventHandlers = {
  connect: () => console.log('Socket connect'),
  disconnect: () => console.log('Socket disconnect'),

  // Servicesb
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
  'service/updated': (msg: ConnectdMessage) =>
    console.log('service/updated', msg),
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
  'service/uptime': (msg: ConnectdMessage) =>
    console.log('service/uptime', msg),
  'service/unknown': (...args) => console.log('service/unknown', ...args),

  // connectd binary
  'connectd/install/error': () => console.log('connectd/install/error'),
  'connectd/install/progress': () => console.log('connectd/install/progress'),
  'connectd/install/done': () => console.log('connectd/install/done'),

  // User/auth
  'user/signed-out': () => store.dispatch.auth.signedOut(),
  'user/signed-in': (user: IUser) => store.dispatch.auth.signedIn(user),
}

export default new BackendAdapter(handlers)
