declare global {
  export type SocketAction =
    // user/auth
    | 'user/check-sign-in'
    | 'user/sign-in'
    | 'user/sign-out'
    | 'user/quit'

    // binaries
    | 'binaries/install'

    // all connections update
    | 'pool'

    // single connection update
    | 'connection'

    // individual actions
    | 'service/connect'
    | 'service/disconnect'
    | 'service/forget'
    | 'service/restart'

    // App/settings
    | 'app/open-on-login'

    // Jump
    | 'init'
    | 'targets'
    | 'device'
    | 'scan'
    | 'interfaces'

  export type SocketEvent =
    // built-in events
    | 'connect'
    | 'disconnect'
    | 'connect_error'

    // user/auth
    | 'user/signed-out'
    | 'user/sign-in/error'
    | 'user/signed-in'

    // connection pool
    | 'pool'

    // connection update
    | 'connection'

    // connection events
    | 'service/started'
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
    | 'targets'
    | 'device'
    | 'scan'
    | 'interfaces'

  type BinaryName = 'connectd' | 'muxer' | 'demuxer'

  interface InstallationInfo {
    name: string
    path: string
    version: string
  }

  export interface IConnection {
    id: string
    name?: string
    port?: number
    pid?: number
    active?: boolean
    deviceID?: string
    host?: ipAddress // Bind address
    restriction?: ipAddress // Restriction IP address
    autoStart?: boolean
    connecting?: boolean
    createdTime?: number // unix timestamp track for garbage cleanup
    startTime?: number // unix timestamp connection start time
    endTime?: number // unix timestamp connection close time
    // deepLink?: string
    error?: {
      code?: number
      message: string
    }
  }

  export interface ConnectionLookup {
    [id: string]: IConnection
  }
  export interface ConnectionMessage {
    connection: IConnection
    raw?: string
    extra?: any
  }

  export interface ConnectionErrorMessage {
    code?: number
    error: string
    connection: IConnection
  }

  export type SocketEmit = (name: string, ...args: any[]) => any

  export interface ITarget {
    hostname: string //     proxy_dest_ip      service ip to forward
    hardwareID?: string
    uid: string //          UID
    name: string
    secret?: string //      password
    port: number //         proxy_dest_port    service port
    type: number //         application_type   service type
  }

  export interface IDevice extends ITarget {}

  export type IScan = [string, [number, string][]] // address, port, type string

  export type IScanData = {
    [networkName: string]: {
      timestamp: number
      data: IScan[]
    }
  }

  export type IInterface = { [key: string]: any }

  export type IInterfaceType = 'Wired' | 'Wireless' | 'FireWire' | 'Thunderbolt' | 'Bluetooth' | 'Other'

  export type ipAddress = string // namespace to indicate if expecting an ip address
}

export {}
