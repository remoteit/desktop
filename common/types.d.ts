declare global {
  export type SocketAction =
    // user/auth
    | 'user/check-sign-in'
    | 'user/sign-in'
    | 'user/sign-out'
    | 'user/quit'

    // binaries
    | 'binaries/install'

    // individual service/connection
    | 'connections/list'
    | 'service/connect'
    | 'service/disconnect'
    | 'service/forget'
    | 'service/restart'

    // App / settings
    | 'app/open-on-login'

  export type SocketEvent =
    // built-in events
    | 'connect'
    | 'disconnect'

    // user/auth
    | 'user/signed-out'
    | 'user/sign-in/error'
    | 'user/signed-in'

    // connections
    | 'service/connecting'
    | 'service/connect/started'
    | 'service/connected'
    | 'service/disconnected'
    | 'service/forgotten'
    | 'service/error'
    | 'service/status'
    | 'service/uptime'
    | 'service/request'
    | 'service/tunnel/opened'
    | 'service/tunnel/closed'
    | 'service/throughput'
    | 'service/version'
    | 'service/unknown-event'

    // binary
    | 'binary/install/start'
    | 'binary/install/progress'
    | 'binary/install/error'
    | 'binary/installed'
    | 'binary/not-installed'

    // jump
    | 'jump/connect'
    | 'jump/connect_error'
    | 'jump/targets'
    | 'jump/device'
    | 'jump/scan'
    | 'jump/interfaces'

  type BinaryName = 'connectd' | 'muxer' | 'demuxer'

  interface InstallationInfo {
    name: string
    path: string
    version: string
  }

  export interface ConnectionInfo {
    deviceID?: string
    id: string
    name: string
    type: string
    port?: number
    pid?: number
    connecting?: boolean
    error?: {
      code?: number
      message: string
    }
  }

  export interface ConnectdMessage {
    connection: ConnectionInfo
    raw?: string
    extra?: any
  }

  export interface ConnectionErrorMessage {
    code?: number
    error: string
    connection: ConnectionInfo
  }

  export type SocketEmit = (name: string, ...args: any[]) => any

  // export enum ConnectdEvent {
  //   error = 'service/error',
  //   uptime = 'service/uptime',
  //   status = 'service/status',
  //   throughput = 'service/throughput',
  //   updated = 'service/updated',
  //   request = 'service/request',
  //   connecting = 'service/connecting',
  //   connected = 'service/connected',
  //   tunnelOpened = 'service/tunnel/opened',
  //   tunnelClosed = 'service/tunnel/closed',
  //   disconnected = 'service/disconnected',
  //   unknown = 'service/unknown-event',
  // }
}

// declare module 'remote.it' {
//   export interface IService {
//     connecting?: boolean
//     port?: number
//     pid?: number
//   }
// }

export {}
