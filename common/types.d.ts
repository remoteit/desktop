declare global {
  export type SocketAction =
    //socket auth
    | 'authentication'

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

    // Backend
    | 'init'
    | 'targets'
    | 'device'
    | 'scan'
    | 'interfaces'
    | 'freePort'
    | 'restart'
    | 'uninstall'

  export type SocketEvent =
    // built-in events
    | 'connect'
    | 'disconnect'
    | 'connect_error'

    // user/auth
    | 'signed-out'
    | 'signed-in'
    | 'sign-in/error'

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
    | 'privateIP'

  type BinaryName = 'connectd' | 'muxer' | 'demuxer'

  interface InstallationInfo {
    name: string
    path: string
    version: string
  }

  interface UserCredentials {
    username: string
    authHash: string
  }

  export interface IConnection {
    id: string
    name: string
    owner: string
    deviceID: string
    online: boolean
    pid?: number
    port?: number
    active?: boolean
    host?: ipAddress // Bind address
    restriction?: ipAddress // Restriction IP address
    autoStart?: boolean
    connecting?: boolean
    username?: string // support for launching where username could be saved
    createdTime?: number // unix timestamp track for garbage cleanup
    startTime?: number // unix timestamp connection start time
    endTime?: number // unix timestamp connection close time
    error?: ISimpleError
    // deepLink?: string
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

  export type IScanDataRaw = {
    host: string
    name: string
    port: number
    protocol: string
  }

  export type ISimpleError = { code?: number; message: string }

  export type ILog = { [id: string]: string[] }

  export type IInterface = { [key: string]: any }

  export type IInterfaceType = 'Wired' | 'Wireless' | 'FireWire' | 'Thunderbolt' | 'Bluetooth' | 'Other'

  export type ipAddress = string // namespace to indicate if expecting an ip address

  export type ipClass = 'A' | 'B' | 'C'
}

export {}
