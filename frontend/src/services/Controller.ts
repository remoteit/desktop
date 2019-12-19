import io from 'socket.io-client'
import { store } from '../store'
import { PORT } from '../constants'
import { EventEmitter } from 'events'

class Controller extends EventEmitter {
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

  open() {
    if (!this.socket.connected) {
      this.socket.open()
    }
  }

  close() {
    if (this.socket.connected) {
      this.socket.close()
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
    console.log('Controller EMIT', event, args)
    this.socket.emit(event, ...args)
    return true
  }
}

type EventHandlers = { [event: string]: (data?: any) => any }

function getEventHandlers() {
  const { binaries, auth, backend, ui } = store.dispatch

  return {
    connect: () => {
      console.log('SOCKET CONNECT')
      ui.connected()
      auth.init()
    },

    authenticated: () => auth.authenticated(),

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

    admin: (result: string) => {
      console.log('admin user', result)
      backend.set({ key: 'admin', value: result })
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

    // User
    'signed-out': () => auth.signedOut(),

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
    'service/version': (msg: ConnectionMessage) => console.log('service/version', msg),
    'service/unknown-event': (msg: ConnectionMessage) => console.log('service/unknown-event', msg),
    // 'service/throughput': (msg: ConnectionMessage) => console.log('service/throughput', msg),

    // muxer binary
    'binary/install/error': (error: string) => binaries.installError(error),
    'binary/install/progress': (progress: number) => console.log('binary/install/progress', progress),
    'binary/installed': (info: InstallationInfo) => binaries.installed(info),
    'binary/not-installed': (binary: string) => binaries.notInstalled(binary),
  } as EventHandlers
}

export default new Controller()
