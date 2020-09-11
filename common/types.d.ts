declare global {
  type SocketAction =
    //socket auth
    | 'authentication'
    | 'heartbeat'

    // user/auth
    | 'user/check-sign-in'
    | 'user/sign-in'
    | 'user/sign-out-complete'
    | 'user/sign-out'
    | 'user/clear-all'
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
    | 'service/clear-recent'
    | 'service/launch'

    // App/settings
    | 'app/open-on-login'
    | 'showFolder'

    // Backend
    | 'init'
    | 'targets'
    | 'device'
    | 'registration'
    | 'scan'
    | 'oobCheck'
    | 'interfaces'
    | 'freePort'
    | 'restart'
    | 'uninstall'
    | 'preferences'
    | 'osInfo'

  type SocketEvent =
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
    | 'service/putty/required'

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
    | 'preferences'

  type BinaryName = 'connectd' | 'muxer' | 'demuxer'

  type Ios = 'mac' | 'windows' | 'linux' | 'rpi'

  interface InstallationInfo {
    name: string
    path: string
    version: string
    installedVersion?: string
  }

  interface UserCredentials {
    username: string
    authHash: string
  }

  interface IConnection {
    id: string
    name: string
    owner: string
    deviceID: string
    online: boolean // online if service is online
    port?: number
    active?: boolean // active if connected
    host?: ipAddress // Bind address
    typeID?: number // service type ID
    restriction?: ipAddress // Restriction IP address
    autoStart?: boolean // auto retry connect if closed
    isP2P?: boolean // if the connection was made with peer to peer vs failover
    failover?: boolean // allow proxy failover
    connecting?: boolean
    username?: string // support for launching where username could be saved
    launchTemplate?: string // deep link launch url template
    createdTime?: number // unix timestamp track for garbage cleanup
    startTime?: number // unix timestamp connection start time
    endTime?: number // unix timestamp connection close time
    error?: ISimpleError
    [index: string]: any // needed to be able to iterate the keys :(
  }

  type IConnectionKey = keyof IConnection

  interface IosInfo {
    os: IConnection
    version: string
    arch: any
  }

  interface ConnectionLookup {
    [id: string]: IConnection
  }
  interface ConnectionMessage {
    connection: IConnection
    raw?: string
    extra?: any
  }

  interface ConnectionErrorMessage extends ISimpleError {
    connection: IConnection
  }

  type SocketEmit = (name: string, ...args: any[]) => any

  interface ITarget {
    hostname: string //     proxy_dest_ip      service ip to forward
    hardwareID?: string
    uid: string //          UID
    name: string
    secret?: string //      password
    port: number //         proxy_dest_port    service port
    type: number //         application_type   service type
    disabled: boolean //    service enabled / disabled
  }

  interface ITargetDevice extends ITarget {}

  interface IDevice {
    id: string
    name: string
    owner: string
    state: DeviceState
    hardwareID?: string
    lastReported: Date
    externalAddress: ipAddress
    internalAddress: ipAddress
    targetPlatform: number
    availability: number
    instability: number
    version: number // daemon version
    geo: {
      connectionType?: string
      countryName?: string
      stateName?: string
      city?: string
      isp?: string
    }
    createdAt: Date
    contactedAt: Date
    shared: boolean
    services: IService[]
    hidden?: boolean
    access: IUser[]
    attributes: ILookup & {
      name?: string
      color?: number
      label?: string
      accessDisabled?: boolean
    }
  }

  interface IService {
    contactedAt: Date
    createdAt: Date
    id: string
    name: string
    lastReported: Date
    state: ServiceState
    type: string
    deviceID: string
    connection?: IConnection
    typeID?: number
    port?: number
    protocol?: string
    sessions: IUser[]
    access: IUser[]
    attributes: {
      name?: string
    }
  }

  type IUser = {
    email: string
    timestamp?: Date
    created?: Date
    platform?: number
    scripting?: boolean
  }

  type gqlOptions = {
    size: number
    from: number
    state?: string
    name?: string
    ids?: string[]
  }

  interface IRegistration {
    device: ITargetDevice
    targets: ITarget[]
  }

  interface IOob {
    oobAvailable: boolean
    oobActive: boolean
  }

  interface IPuttyValidation {
    install: boolean
    loading: boolean
    pathPutty: string
  }

  interface ILan {
    oobAvailable: boolean
    oobActive: boolean
  }

  type IScan = [string, [number, string][]] // address, port, type string

  type IScanData = {
    [networkName: string]: {
      timestamp: number
      data: IScan[]
    }
  }

  type IScanDataRaw = {
    host: string
    name: string
    port: number
    protocol: string
  }

  type ISimpleError = { code?: number; message: string }

  type ErrorCallback = (error: Error) => void

  type ILog = { [id: string]: string[] }

  type IInterface = { [key: string]: any }

  type IInterfaceType = 'Wired' | 'Wireless' | 'FireWire' | 'Thunderbolt' | 'Bluetooth' | 'Other'

  type ipAddress = string // namespace to indicate if expecting an ip address

  type ipClass = 'A' | 'B' | 'C'

  type IEvents = { [event: string]: string }

  type ILookup = { [key: string]: any }

  type ISelect = { [key: string]: string | number }

  type IPreferences = ILookup

  type SegmentContext = {
    category?: string
    appName?: string
    appVersion?: string
    systemOS?: string
    systemOSVersion?: string
    systemArch?: string
    manufacturerId?: string
    productVersion?: string
    productId?: string
    productPlatform?: number
    productAppCode?: number
    oobAvailable?: boolean
    oobActive?: boolean
    url?: string
    search?: string
    referrer?: string
  }

  type ManufacturerDetails = {
    manufacturer: {
      id?: string
    }
    product: {
      id?: string
      version?: string
      platform?: number
      appCode?: number //called manufacturerId in connectd
    }
  }

  type IShareProps = {
    deviceId: String
    email: !String[]
    scripting?: boolean
    services?: IService[]
  }
}

export {}
