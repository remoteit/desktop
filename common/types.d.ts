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
    | 'service/disable'
    | 'service/forget'
    | 'service/restart'
    | 'service/clear'
    | 'service/clear-recent'
    | 'launch/app'

    // App/settings
    | 'maximize'
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
    | 'useCertificate'

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

  interface ISearch {
    deviceName: string
    serviceName: string
    deviceId: string
    serviceId: string
    accountEmail: string
  }
  interface IConnection {
    address?: string // the connection url returned from cli
    commandTemplate?: string // command line launch template
    connected?: boolean
    connecting?: boolean
    disconnecting?: boolean
    createdTime?: number // unix timestamp track for garbage cleanup
    deviceID?: string
    enabled?: boolean // if the connection is active
    endTime?: number // unix timestamp connection close time
    error?: ISimpleError
    failover?: boolean // allow proxy failover
    host?: ipAddress // returned hostname from cli
    id: string
    ip?: ipAddress // bind address
    isP2P?: boolean // if the connection was made with peer to peer vs failover
    launchTemplate?: string // deep link launch url template
    log?: boolean // if cli should log the connectd stdout to file
    name?: string
    online?: boolean // online if service is online
    owner?: IUserRef
    port?: number
    proxyOnly?: boolean // disabled p2p
    public?: boolean // if the connection should be a public proxy link
    publicId?: string // public proxy connection ID
    publicRestriction?: ipAddress // public proxy restriction IP
    reachable?: boolean // if remote connection resource is reachable
    restriction?: ipAddress // Restriction IP address
    sessionId?: string //the connection session id
    startTime?: number // unix timestamp connection start time
    timeout?: number // timeout to disconnect in minutes
    typeID?: number // service type ID
    username?: string // support for launching where username could be saved
    [index: string]: any // needed to be able to iterate the keys :(
  }

  type IConnectionState =
    | 'offline'
    | 'disconnected'
    | 'connected'
    | 'connecting'
    | 'disconnecting'
    | 'stopping'
    | 'ready'

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
    tags: number[]
    quality: 'GOOD' | 'MODERATE' | 'POOR' | 'UNKNOWN'
    version: number // daemon version
    configurable: boolean // cloudshift device
    accountId: string
    thisDevice?: boolean
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
    license: 'UNKNOWN' | 'EVALUATION' | 'LICENSED' | 'UNLICENSED' | 'NON_COMMERCIAL' | 'LEGACY'
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
    id?: string
    isP2P?: boolean
    timestamp: Date
    platform: number
    state?: IConnectionState
    user?: IUserRef
    geo?: IGeo
    public?: boolean
    target: {
      id: string
      deviceId: string
      platform: number
      name: string // combined service + device names
    }
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
    license: { id: string } | null
  }

  type ILicense = {
    id: string
    created: Date
    updated: Date
    expiration: Date | null
    valid: boolean
    upgradeUrl?: string
    plan: {
      id: string
      name: string
      description: string
      duration: string | null
      product: {
        id: string
        name: string
        description: string
        provider: string | null
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
    isP2P: boolean
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
    devices?: { id?: number; name?: string }[]
  }

  interface IEventList {
    total: number
    items: IEvent[]
    hasMore: boolean
    deviceId?: string
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

  type IOverrides = {
    apiURL?: string
    betaApiURL?: string
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

  type IGuide = {
    step: number
    total: number
    done?: boolean
    title?: string
    active?: boolean
  }

  type IPreferences = {
    version: string
    cliVersion: string
    autoUpdate?: boolean
    openAtLogin?: boolean
    remoteUIOverride?: boolean
    disableLocalNetwork?: boolean
    showNotifications?: boolean
    allowPrerelease?: boolean
    useCertificate?: boolean
    switchApi?: boolean
    apiURL?: ''
    apiGraphqlURL?: ''
    testUI?: 'OFF' | 'ON' | 'HIGHLIGHT'
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

  type INavigation = {
    label: string
    path: string
    match: string
    icon: string
    show: boolean
    badge?: number
    chip?: string
    footer?: boolean
    chipPrimary?: boolean
  }
}

export {}
