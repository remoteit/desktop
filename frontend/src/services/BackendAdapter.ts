import io from 'socket.io-client'
import { store } from '../store'
import { PORT } from '../constants'
import { EventEmitter } from 'events'
import { IUser } from 'remote.it'

class BackendAdapter extends EventEmitter {
  private socket = io(`http://localhost:${PORT}`)

  init() {
    const handlers = getEventHandlers()

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
    console.log('BackendAdaptor EMIT', args)
    this.socket.emit(event, ...args)
    return true
  }
}

type EventHandlers = { [event: string]: (data?: any) => any }

function getEventHandlers() {
  const { binaries, auth, backend, ui } = store.dispatch

  return {
    connect: () => ui.connected(),
    disconnect: () => ui.disconnected(),
    connect_error: () => backend.set({ key: 'error', value: true }),

    pool: (result: IConnection[]) => {
      console.log('socket pool', result)
      backend.set({ key: 'connections', value: result })
    },

    connection: (result: IConnection) => {
      console.log('socket connection', result)
      backend.setConnection(result)
    },

    targets: (result: ITarget[]) => {
      console.log('socket targets', result)
      if (result) {
        backend.set({ key: 'added', value: undefined })
        backend.set({ key: 'targets', value: result })
      }
    },

    device: (result: IDevice) => {
      console.log('socket device', result)
      if (result) backend.set({ key: 'device', value: result })
    },

    scan: (result: IScanData) => {
      console.log('socket scan', result)
      if (result) backend.set({ key: 'scanData', value: result })
    },

    interfaces: (result: IInterface[]) => {
      console.log('socket interfaces', result)
      if (result) backend.set({ key: 'interfaces', value: result })
    },

    freePort: (result: number) => backend.set({ key: 'freePort', value: result }),

    privateIP: (result: ipAddress) => backend.set({ key: 'privateIP', value: result }),

    // Connections
    'service/started': (msg: ConnectionMessage) => backend.setConnection(msg.connection), /// devices.connectStart(conn.id)
    'service/connected': (msg: ConnectionMessage) => backend.setConnection(msg.connection), ///  devices.connected(msg.connection)
    'service/disconnected': (msg: ConnectionMessage) => backend.setConnection(msg.connection), ///  devices.disconnected(msg)
    'service/forgotten': (id: string) => console.log(id), // / devices.forgotten(id)
    'service/error': (msg: ConnectionErrorMessage) => backend.setConnection(msg.connection), /// devices.connectionError(msg)
    'service/status': (msg: ConnectionMessage) => console.log('service/status', msg),
    'service/uptime': (msg: ConnectionMessage) => console.log('service/uptime', msg),
    'service/request': (msg: ConnectionMessage) => console.log('service/request', msg),
    'service/tunnel/opened': (msg: ConnectionMessage) => console.log('service/tunnel/opened', msg),
    'service/tunnel/closed': (msg: ConnectionMessage) => console.log('service/tunnel/closed', msg),
    // 'service/throughput': (msg: ConnectionMessage) => console.log('service/throughput', msg),
    'service/version': (msg: ConnectionMessage) => console.log('service/version', msg),
    'service/unknown-event': (msg: ConnectionMessage) => console.log('service/unknown-event', msg),

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
  } as EventHandlers
}

export default new BackendAdapter()
