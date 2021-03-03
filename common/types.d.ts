declare global {
  type SocketAction =
    //socket auth
    | 'authentication'
    | 'heartbeat'

    // user/auth
    | 'user/check-sign-in'
    | 'user/sign-in'
    | 'user/sign-out-complete'
    | 'user/lock'
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
    | 'service/clear'
    | 'service/clear-recent'
    | 'launch/app'

    // App/settings
    | 'app/open-on-login'
    | 'showFolder'

    // Backend
    | 'init'
    | 'targets'
    | 'device'
    | 'registration'
    | 'restore'
    | 'scan'
    | 'oobCheck'
    | 'interfaces'
    | 'freePort'
    | 'restart'
    | 'uninstall'
    | 'preferences'
    | 'osInfo'
    | 'reachablePort'

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
    | 'required/app'

    // binary
    | 'binary/install/start'
    | 'binary/install/progress'
    | 'binary/install/error'
    | 'binary/installed'
    | 'binary/not-installed'

    // backend
    | 'targets'
    | 'device'
    | 'scan'
    | 'interfaces'
    | 'privateIP'
    | 'preferences'
    | 'reachablePort'

  type BinaryName = 'remoteit' | 'connectd' | 'muxer' | 'demuxer'

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
    guid: string
  }

  interface IConnection {
    id: string
    name: string
    owner: IUserRef
    deviceID: string
    online: boolean // online if service is online
    port?: number
    connected?: boolean
    enabled?: boolean // if the connection is active
    host?: ipAddress // Bind address
    typeID?: number // service type ID
    restriction?: ipAddress // Restriction IP address
    autoStart?: boolean // auto retry connect if closed
    isP2P?: boolean // if the connection was made with peer to peer vs failover
    failover?: boolean // allow proxy failover
    proxyOnly?: boolean // disabled p2p
    connecting?: boolean
    sessionId?: string //the connection session id
    username?: string // support for launching where username could be saved
    launchTemplate?: string // deep link launch url template
    commandTemplate?: string // command line launch template
    createdTime?: number // unix timestamp track for garbage cleanup
    startTime?: number // unix timestamp connection start time
    endTime?: number // unix timestamp connection close time
    error?: ISimpleError
    log?: boolean // if cli should log the connectd stdout to file
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

  type IStrategy = 'failover' | 'p2p' | 'proxy'

  interface ITarget {
    hostname: string //     proxy_dest_ip      service ip to forward
    hardwareID?: string
    uid: string //          UID
    name?: string
    secret?: string //      password
    port: number //         proxy_dest_port    service port
    type: number //         application_type   service type
    disabled: boolean //    service enabled / disabled
  }

  interface ITargetDevice extends ITarget {}

  interface IDevice {
    id: string
    name: string
    owner: IUser
    state: 'active' | 'inactive'
    hardwareID?: string
    lastReported: Date
    externalAddress: ipAddress
    internalAddress: ipAddress
    targetPlatform: number
    availability: number
    instability: number
    quality: 'GOOD' | 'MODERATE' | 'POOR' | 'UNKNOWN'
    version: number // daemon version
    configurable: boolean // cloudshift device
    accountId: string
    geo: IGeo & {
      connectionType?: string
      isp?: string
    }
    createdAt: Date
    contactedAt: Date
    shared: boolean
    services: IService[]
    hidden?: boolean
    access: IUser[]
    attributes: ILookup<any> & {
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
    enabled?: boolean
    state: IDevice['state']
    type: string
    deviceID: string
    connection?: IConnection
    typeID?: number
    port?: number
    host?: ipAddress
    protocol?: string
    access: IUser[]
    license: 'UNKNOWN' | 'EVALUATION' | 'LICENSED' | 'UNLICENSED'
    attributes: ILookup<any> & {
      // altname?: string // can't have this collide with service name
      route?: IRouteType // p2p with failover | p2p | proxy
      defaultPort?: number
      launchTemplate?: string
      commandTemplate?: string
    }
  }

  type IUser = {
    id: string
    email: string
    authHash?: string
    yoicsId?: string
    created?: Date
    // platform?: number // fixme - unconfuse IUser with ISessionFixme
    timestamp?: Date
    scripting?: boolean // @FIXME why do we have scripting on a user seems like a share setting
  }

  type IUserRef = {
    id: string
    email: string
  }

  type IGeo = {
    countryName: string
    stateName: string
    city: string
  }

  type ISession = {
    id: string
    timestamp: Date
    platform: number
    user: IUserRef
    geo?: IGeo
    target: {
      id: string
      deviceId: string
      platform: number
      name: string // combined service + device names
    }
  }

  type ISessionFixme = {
    id: string // user id
    sessionId: string // FIXME this should be the id
    timestamp: Date
    email: string // user email FIXME this should be a IUserRef
    platform: number
  }

  type IApplicationType = {
    id: number
    name: string
    port: number
    proxy: boolean
    protocol: 'TCP' | 'UDP'
    description: string
  }
  type ILimit = {
    name: string
    value: any
    actual: any
    license?: { id: string }
  }

  type ILicense = {
    id: string
    created: Date
    updated: Date
    expiration?: Date
    valid: boolean
    value: object
    plan: {
      id: string
      name: string
      description: string
      duration: string
      product: {
        id: string
        name: string
        description: string
        provider: string
      }
    }
  }

  type IAnnouncement = {
    id: string
    type: INoticeType
    title: string
    link: string
    image: string
    body: string
    modified?: Date
    read?: Date
  }

  type INoticeType = 'GENERIC' | 'SYSTEM' | 'RELEASE' | 'COMMUNICATION' | 'SECURITY'

  interface ICloudEvent {
    sessionId: string
    type: 'DEVICE_STATE' | 'DEVICE_CONNECT' | 'DEVICE_SHARE'
    state: IDevice['state'] | 'connected' | 'disconnected'
    timestamp: Date
    actor: IUserRef
    users: IUserRef[]
    platform: IUser['platform']
    authUserId: string
    geo?: IGeo
    target: {
      id: string
      name: string
      owner: IUserRef
      typeID: IService['typeID']
      platform: IDevice['targetPlatform']
      deviceId: string
      device?: IDevice
      service?: IService
      connection?: IConnection
    }[]
  }

  interface IRoute {
    key: IRouteType
    icon: string
    name: string
    description: string
  }

  type IRouteType = 'failover' | 'p2p' | 'proxy'

  interface IEvent {
    shared: any
    scripting: boolean
    id: string
    state?: ConnectionState
    timestamp: Date
    type: string
    actor?: IUser
    target?: (IService | IDevice)[]
    users?: IUser[]
    action: string
  }

  interface IEventList {
    total: number
    items: IEvent[]
    hasMore: boolean
    deviceId: string
  }

  type gqlOptions = {
    size: number
    from: number
    account: string
    state?: string
    owner?: boolean
    sort?: string
    name?: string
    ids?: string[]
    platform?: number
  }

  interface IRegistration {
    device: ITargetDevice
    targets: ITarget[]
  }

  interface IAppValidation {
    install: string
    loading: boolean
    path: string
    application: string
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

  type IServiceForm = ITarget & {
    name: string
    attributes: IService['attributes']
  }

  type ICloudAddService = {
    deviceId: string
    name: string
    application: number
    host: string
    port: number
    enabled: boolean
  }

  type ICloudUpdateService = {
    id: string
    name: string
    application: number
    host: string
    port: number
    enabled: boolean
  }

  type ISimpleError = { code?: number; message: string }

  type ErrorCallback = (error: Error) => void

  type ILog = { [id: string]: string[] }

  type IInterface = { [key: string]: any }

  type IInterfaceType = 'Wired' | 'Wireless' | 'FireWire' | 'Thunderbolt' | 'Bluetooth' | 'Other'

  type ipAddress = string // namespace to indicate if expecting an ip address

  type ipClass = 'A' | 'B' | 'C'

  type IEvents = { [event: string]: string }

  type ILookup<T> = { [key: string]: T }

  type ISelect = { [key: string]: string | number }

  type IPreferences = {
    version?: string
    autoUpdate?: boolean
    openAtLogin?: boolean
    remoteUIOverride?: boolean
    disableLocalNetwork?: boolean
    showNotifications?: boolean
  }

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
    deviceId: string
    email: !string[]
    scripting?: boolean
    services?: {
      serviceId: string
      action: 'ADD' | 'REMOVE' | string
    }[]
  }

  type IReachablePort = {
    port: number
    host?: string
    isValid?: boolean
    loading?: boolean
  }

  type ILaunchApp = {
    port?: number
    host?: string
    username?: string
    path: string
    application: string
  }

  type IShowFolderType = 'logs' | 'connections'
}

export {}
