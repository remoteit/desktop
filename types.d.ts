declare global {
  type Color =
    | 'primary'
    | 'primaryLight'
    | 'primaryLighter'
    | 'primaryHighlight'
    | 'primaryBackground'
    | 'primaryDark'
    | 'calm'
    | 'successLight'
    | 'success'
    | 'successDark'
    | 'dangerLight'
    | 'danger'
    | 'warning'
    | 'warningLightest'
    | 'warningHighlight'
    | 'gray'
    | 'grayLightest'
    | 'grayLighter'
    | 'grayLight'
    | 'grayDark'
    | 'grayDarker'
    | 'grayDarkest'
    | 'white'
    | 'alwaysWhite'
    | 'black'
    | 'darken'
    | 'hover'
    | 'screen'
    | 'shadow'
    | 'rpi'
    | 'guide'
    | 'test'
    | 'brandPrimary'
    | 'brandSecondary'

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
    | 'connections'

    // individual actions
    | 'service/connect'
    | 'service/disconnect'
    | 'service/stop'
    | 'service/forget'
    | 'service/restart'
    | 'service/clear'
    | 'service/clearRecent'
    | 'service/clearErrors'
    | 'launch/app'

    // App/settings
    | 'navigate'
    | 'maximize'
    | 'showFolder'
    | 'filePrompt'
    | 'cancelBluetooth'

    // Backend
    | 'init'
    | 'refresh'
    | 'targets'
    | 'device'
    | 'registration'
    | 'restore'
    | 'scan'
    | 'oobCheck'
    | 'interfaces'
    | 'freePort'
    | 'uninstall'
    | 'preferences'
    | 'osInfo'
    | 'reachablePort'
    | 'useCertificate'
    | 'sshConfig'
    | 'forceUnregister'
    | 'update/check'
    | 'update/install'

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
    | 'canNavigate'

  type IEnvironment = {
    os?: Ios
    portal: boolean
    privateIP: string
  }

  type BinaryReason = {
    binariesOutdated: boolean
    agentStopped: boolean
    agentMismatched: boolean
    cliUpdated: boolean
    desktopUpdated: boolean
  }

  type Ios = 'mac' | 'windows' | 'linux' | 'rpi' | 'android' | 'ios'

  interface CommonAdaptorInterface {
    getState: () => { environment: IEnvironment; preferences: IPreferences }
    getCloudData: (typeId?: number) => IApplicationType
    escapeRegex: (string: string) => string
  }

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

  interface IRawUser {
    guid: string
    auth_token: string
    authHash: string
    token: string
    service_authhash: string
  }

  interface ISearch {
    accountId: string
    nodeId: string
    nodeName: string
    nodeType: INodeType | string
    serviceId: string
    serviceName: string
    ownerEmail: string
    targetPlatform: number
    combinedName: string
  }

  type INodeType = 'DEVICE' | 'NETWORK'

  interface INetwork extends IInstance {
    accountId: string
    cloud: boolean // is not a local network
    connectionNames: INameLookupByServiceId
    serviceIds: string[]
    sessions?: ISession[]
    icon?: string
    iconType?: IconType
  }

  type INameLookupByServiceId = ILookup<string>

  interface IConnection {
    accountId?: string // organization id
    autoLaunch?: boolean
    autoClose?: boolean // run close command on disconnect
    autoStart?: boolean
    commandLog?: string[]
    commandTemplate?: string // DEPRECATED command line launch template
    connected?: boolean
    connecting?: boolean
    connectLink?: boolean // is public persistent link
    connectOnReady?: boolean // if the connection should be started when the service is ready
    createdTime?: Timestamp // unix timestamp track for garbage cleanup
    default?: boolean // if the connection is in a default state - gets removed on modification
    description?: string
    deviceID?: string
    disableSecurity?: boolean //disable https security
    disconnecting?: boolean
    enabled: boolean // if the connection is active
    endTime?: Timestamp // unix timestamp connection close time
    error?: ISimpleError
    failover?: boolean // allow proxy failover
    host?: string // returned hostname from cli
    id: string
    identity?: ISSHIdentity
    ip?: ipAddress // bind address
    isP2P?: boolean // if the connection was made with peer to peer vs failover
    launchTemplate?: string // DEPRECATED deep link launch url template
    launchTemplates?: ILookup<string> // deep link launch templates
    launchType?: 'URL' | 'SCRIPT' | 'COMMAND' | 'TERMINAL' | 'NONE' // scheme to use for launching
    launched?: boolean // if the connection has been launched
    log?: boolean // if cli should log the connectd stdout to file
    name?: string
    online?: boolean // online if service is online
    owner?: IUserRef
    password?: string | null // link password
    path?: string // application path
    port?: number
    proxyOnly?: boolean // disabled p2p
    public?: boolean // if the connection should be a public proxy link
    publicId?: string // public proxy connection ID
    publicRestriction?: ipAddress // public proxy restriction IP
    ready?: boolean // if the connection is ready to connect
    restriction?: ipAddress // Restriction IP address
    sessionId?: string //the connection session id
    starting?: boolean // if the connection listening is starting up
    startTime?: Timestamp // unix timestamp connection start time
    stopLock?: number // connection stopped by user do not re-added if missing from cli for 5 minutes
    stopping?: boolean // service stopping the listener
    surveyed?: string // the session ID of the survey that has been answered
    targetHost?: ipAddress // default localhost
    timeout?: number // timeout to disconnect in minutes
    typeID?: number // service type ID
    updating?: boolean // waiting for cloud update
    username?: string // support for launching where username could be saved
    rawEndpoint?: string // raw endpoint from cli
    rawCommand?: string // raw connectd command from cli
    checkpoint?: {
      canBindToPortLocally: boolean
      connectdCanAuth: boolean
      connectdCanConnectToChatServers: boolean
      connectdCanPortBind: boolean
      connectdCanStart: boolean
      connectdTunnelCreated: boolean
      hostnameCanFetch: boolean
      hostnameCanResolve: boolean
      proxyCanCreate: boolean
      targetServiceReachable: boolean
    }
  }

  type ISSHIdentity = {
    User?: string
    Password?: string
    IdentityFile?: string // ssh identity file path
  }

  type IConnectionState =
    | 'offline'
    | 'online'
    | 'connected'
    | 'connecting'
    | 'disconnecting'
    | 'starting'
    | 'stopping'
    | 'ready'

  type IConnectionSource = 'UNKNOWN' | 'INTERNAL' | 'EXTERNAL' | 'WEBSOCKET'

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

  type CLIDeviceProps =
    | {
        hostname: string // proxy_dest_ip - service ip to forward
        hardwareId?: string
        uid: string // UID
        name?: string
        secret?: string // password
        port: number // proxy_dest_port - service port
        type: number // application_type - service type
        disabled: boolean // service enabled / disabled
      }
    | undefined

  type IServiceRegistration = {
    name?: string
    application: number
    host?: string
    port?: number
    enabled?: boolean
  }

  interface IInstance {
    id: string
    name: string
    shared: boolean
    loaded?: boolean
    owner: IUserRef
    permissions: IPermission[]
    access: IUserRef[]
    tags: ITag[]
  }

  interface IDevice extends IInstance {
    state: 'active' | 'inactive'
    hardwareId?: string
    lastReported: Date
    externalAddress: ipAddress
    internalAddress: ipAddress
    targetPlatform: number
    availability: number
    instability: number
    onlineSince: Timestamp
    offlineSince: Timestamp
    quality: 'GOOD' | 'MODERATE' | 'POOR' | 'UNKNOWN'
    version?: number // daemon version
    configurable: boolean // cloud shift device
    scriptable: boolean
    accountId: string // organization id
    thisDevice?: boolean
    license: ILicenseTypes
    geo: IGeo & {
      connectionType?: string
      isp?: string
    }
    createdAt?: Date
    contactedAt?: Date
    shared: boolean
    services: IService[]
    hidden?: boolean
    newDevice?: boolean
    presenceAddress?: string
    timeSeries?: ITimeSeries
    supportedAppInstalls: number[]
    attributes: ILookup<any> & {
      name?: string
      color?: number
      label?: string
      accessDisabled?: boolean
      notificationEmail?: boolean | null
      notificationSystem?: boolean | null
    }
    notificationSettings: {
      emailNotifications?: boolean | null
      desktopNotifications?: boolean | null
    }
  }

  interface IService {
    id: string
    name: string
    subdomain: string
    lastReported: Date
    contactedAt: Date
    createdAt: Date
    enabled?: boolean
    loaded?: boolean
    state: IDevice['state']
    type: string
    deviceID: string
    link?: {
      url: string
      web: boolean
      code: string
      created: Date
      enabled: boolean
      password?: string
    }
    typeID: number
    port?: number
    host?: ipAddress
    protocol?: string
    access: IUserRef[]
    license: ILicenseTypes
    presenceAddress?: string
    timeSeries?: ITimeSeries
    attributes: ILookup<any> & {
      route?: IRouteType
      defaultPort?: number
      launchTemplate?: string
      commandTemplate?: string
      targetHost?: string
      description?: string
    }
  }

  type ITimeSeries = {
    type: ITimeSeriesType
    resolution: ITimeSeriesResolution
    start: Date
    end: Date
    time: Date[]
    data: number[]
  }

  type ITimeSeriesOptions = {
    type: ITimeSeriesType
    resolution: ITimeSeriesResolution
    length: number
    timezone?: string
  }

  type ITimeSeriesResolution = 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'

  type ITimeSeriesType =
    | 'AVAILABILITY' // Online Percentage
    | 'ONLINE_DURATION' // Online Duration (in seconds)
    | 'ONLINE' // Number of online events
    | 'OFFLINE' // Number of offline events
    | 'USAGE' // Connected Percentage
    | 'CONNECT_DURATION' // Connected Duration (in seconds)
    | 'CONNECT' // Number of connection events
    | 'DISCONNECT' // Number of disconnect events

  type ITimeSeriesScale = {
    unit: '%' | 'time' | 'events'
    scale: number
  }

  type ILinkData = {
    url: string
    created: Date
    enabled: boolean
    password?: string
    serviceId: string
    deviceId: string
    subdomain: string
  }

  type ITag = {
    name: string
    color: ILabel['id']
    created?: Date
  }

  type ITagOperator = 'ALL' | 'ANY'

  type ITagFilter = {
    operator: ITagOperator
    values: string[]
  }

  interface ISortService {
    name: string
    sortService: (a: IService, b: IService) => number
    icon: string
  }

  type ISortServiceType = 'ATOZ' | 'ZTOA' | 'NEWEST' | 'OLDEST'

  interface IOptionServiceSort {
    ATOZ: ISortService
    ZTOA: ISortService
    NEWEST: ISortService
    OLDEST: ISortService
  }

  type IRoleAccess = 'NONE' | 'TAG' | 'ALL' | 'SELECTED' | 'CUSTOM'

  type ILabel = {
    id: number
    name: string
    color: string
    hidden?: boolean
  }

  type ILicenseTypes = 'UNKNOWN' | 'EVALUATION' | 'LICENSED' | 'UNLICENSED' | 'NON_COMMERCIAL' | 'EXEMPT' | string

  type IPermission = 'VIEW' | 'CONNECT' | 'SCRIPTING' | 'MANAGE' | 'ADMIN'

  type IUser = {
    id: string
    email: string
    authHash?: string
    yoicsId?: string
    created?: Date
    timestamp?: Date
    scripting?: boolean // @FIXME why do we have scripting on a user seems like a share setting
    apiKey?: string
    language?: string
  }

  type IGuest = {
    id: string
    email: string
    deviceIds: string[]
    networkIds: string[]
  }

  type INotificationSetting = {
    emailNotifications?: boolean
    desktopNotifications?: boolean
    urlNotifications?: boolean
    notificationEmail?: string
    notificationUrl?: string
  }

  type IUserRef = {
    id: string
    email: string
    created?: Date
    scripting?: boolean
  }

  type IOrganizationMember = {
    user: IUserRef
    organizationId: string
    license: ILicenseTypes
    roleId: IOrganizationRoleIdType
    created?: Date
  }

  type IMembership = {
    roleId: IOrganizationRoleIdType
    roleName: string
    created: Date
    license: ILicenseTypes
    account: IUserRef
    name?: string
  }

  type IOrganizationRoleIdType = 'OWNER' | 'ADMIN' | 'MEMBER' | 'CUSTOM' | 'REMOVE' | string

  type IOrganizationRole = {
    id: string
    name: string
    system?: boolean
    disabled?: boolean
    permissions: IPermission[]
    access: IRoleAccess
    tag?: ITagFilter
  }

  type ICreateRole = {
    id?: string
    name?: string
    grant?: IPermission[]
    revoke?: IPermission[]
    access?: IRoleAccess
    tag?: ITagFilter
    accountId: string
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
    reverseProxy: boolean
    source: IConnectionSource
    user?: IUserRef
    geo?: IGeo
    manufacturer: 'KEY' | 'ANONYMOUS' | 'UNKNOWN'
    target: {
      id: string
      accountId: string
      deviceId: string
      platform?: number
      name: string // combined service + device names
    }
  }

  type IFile = {
    id: string
    name: string
    created: ISOTimestamp
    updated: ISOTimestamp
    shortDesc?: string
    longDesc?: string
    executable: boolean // if file is a script
    versions: IFileVersion[]
  }

  type IFileVersion = {
    id: string
    arguments: IFileArgument[]
  }

  type IFileArgument = {
    name: string
    desc?: string
    order: number
    argumentType: IFileArgumentType
    options: string[]
  }

  type IFileArgumentType = 'FileSelect' | 'StringSelect' | 'StringEntry'

  type IFileForm = {
    name: string
    description: string
    executable: boolean
    deviceIds: string[]
    access: IRoleAccess
    script?: string
    fileId: string
    jobId?: string
    tag?: ITagFilter
    file?: File
  }

  type IJob = {
    id: string
    status: IJobStatus
    created: ISOTimestamp
    updated: ISOTimestamp
    owner: IUserRef
    user: IUserRef
    tag: ITagFilter
    file?: {
      id: string
      name: string
    }
    jobDevices: IJobDevice[]
  }

  type IJobDevice = {
    id: string
    status: IJobStatus
    created: ISOTimestamp
    updated: ISOTimestamp
    attributes: IJobDeviceAttribute[]
    device: {
      id: string
      name: string
    }
  }

  type IJobDeviceAttribute = {
    key: string
    value: string
  }

  type IJobStatus = 'READY' | 'WAITING' | 'RUNNING' | 'FAILED' | 'SUCCESS' | 'CANCELLED'

  type IScript = IFile & { job?: IJob }

  type IApplicationType = {
    id: number
    name: string
    port: number
    proxy: boolean
    scheme: string
    protocol: 'TCP' | 'UDP'
    description: string
  }

  type IApplicationTypeGroup = Omit<IApplicationType, 'id'> & {
    ids: number[]
  }

  type ISmartApplication = 'URL' | undefined

  interface ICloudEvent {
    sessionId: string
    source: IConnectionSource
    type:
      | 'JOB'
      | 'DEVICE_JOB'
      | 'DEVICE_STATE'
      | 'DEVICE_CONNECT'
      | 'DEVICE_SHARE'
      | 'DEVICE_REFRESH'
      | 'DEVICE_DELETE'
      | 'LICENSE_UPDATED'
    state: IDevice['state'] | 'connected' | 'disconnected'
    action: 'add' | 'update' | 'remove'
    timestamp: Timestamp
    isP2P: boolean
    actor: IUserRef
    users: IUserRef[]
    platform: number
    authUserId: string
    geo?: IGeo
    reverseProxy: boolean
    manufacturer?: number
    manufacturerType: ISession['manufacturer']
    metadata?: INotificationSetting
    job?: {
      id: string
      status: IJobStatus
      owner: { id: string }
      jobDevice?: {
        id: string
        status: IJobStatus
        device: { id: string }
      }
      target?: IJob
    }
    target: {
      id: string
      name: string
      owner: IUserRef
      accountId: string
      typeID: IService['typeID']
      platform: IDevice['targetPlatform']
      deviceId: string
      deviceCreated: Date
      device?: IDevice
      service?: IService
      connection?: IConnection
    }[]
    // For license events
    plan?: {
      name: string
      product: {
        name: string
      }
    }
    quantity?: number
    expiration?: Date
    owner?: IUserRef
  }

  interface IRoute {
    key: IRouteType
    icon: string
    name: string
    description: string
  }

  interface IPasswordValue {
    currentPassword: string
    password: string
  }

  interface IAccessKey {
    key: string
    enabled: boolean
    created: Date
    lastUsed: Date
  }

  type IRouteType = 'failover' | 'p2p' | 'proxy' | 'public'

  interface IEvent {
    shared: any
    scripting: boolean
    id: string
    state?: IDevice['state']
    timestamp: Date
    type: IEventType
    actor?: IUser
    target?: {
      id: string
      name: string
      device: { id: string; name: string }
    }[]
    users?: IUser[]
    action: string
    devices?: { id: string; name: string }[]
    job?: { file?: { name: string } }
  }

  type IEventType =
    | 'AUTH_LOGIN'
    | 'AUTH_LOGIN_ATTEMPT'
    | 'AUTH_PASSWORD_CHANGE'
    | 'AUTH_PASSWORD_RESET'
    | 'AUTH_PASSWORD_RESET_CONFIRMED'
    | 'AUTH_PHONE_CHANGE'
    | 'AUTH_MFA_ENABLED'
    | 'AUTH_MFA_DISABLED'
    | 'LICENSE_UPDATED'
    | 'DEVICE_STATE'
    | 'DEVICE_CONNECT'
    | 'DEVICE_DELETE'
    | 'DEVICE_SHARE'
    | 'DEVICE_REFRESH'
    | 'DEVICE_TRANSFER'
    | 'DEVICE_JOB'
    | 'JOB'

  interface IEventList {
    total: number
    last: string
    items: IEvent[]
    hasMore: boolean
    deviceId?: string
  }

  type gqlOptions = {
    tag?: ITagFilter
    size: number
    from: number
    accountId: string
    columns: string[]
    state?: string
    owner?: boolean
    sort?: string
    name?: string
    applicationTypes?: number[]
    platform?: number[]
    deviceTimeSeries?: ITimeSeriesOptions
    serviceTimeSeries?: ITimeSeriesOptions
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
      timestamp: Timestamp
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
    name?: string
    application?: number
    host?: string
    port?: number
    enabled?: boolean
    presenceAddress?: string
  }

  type ISimpleError = { code?: number; message: string }

  type ErrorCallback = (error: Error) => void

  type ILog = { [id: string]: string[] }

  type IInterface = { [key: string]: any }

  type IInterfaceType = 'Wired' | 'Wireless' | 'FireWire' | 'Thunderbolt' | 'Bluetooth' | 'Other'

  type ipAddress = string // namespace to indicate if expecting an ip address

  type Timestamp = number

  type ISOTimestamp = string

  type ipClass = 'A' | 'B' | 'C'

  type IEvents = { [event: string]: string }

  type ILookup<T, U extends string | symbol | number = string> = {
    [K in U]: T
  }

  type INumberLookup<T> = { [key: number]: T }

  type ISelect = {
    key: string | number
    name: string | number | React.ReactNode
    description?: string
    disabled?: boolean
  }

  type IGuide = {
    step: number
    total: number
    done?: boolean
    title?: string
    active?: boolean
    weight: number
  }

  type IPreferences = {
    version: string
    cliVersion: string
    cliConfigVersion?: number
    autoUpdate?: boolean
    openAtLogin?: boolean
    remoteUIOverride?: boolean
    disableLocalNetwork?: boolean
    allowPrerelease?: boolean
    useCertificate?: boolean
    switchApi?: boolean
    apiURL?: string
    apiGraphqlURL?: string
    webSocketURL?: string
    windowState?: { x?: number; y?: number; width: number; height: number }
    disableDeepLinks?: boolean
    sshConfig?: boolean
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
    email: string[]
    scripting?: boolean
    services?: {
      serviceId: string
      action: 'ADD' | 'REMOVE' | string
    }[]
  }

  type ITransferProps = {
    device?: IDevice
    email?: string
  }

  type IReachablePort = {
    port: number
    host?: string
    isValid?: boolean
    loading?: boolean
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
    Menu?: React.FC
    divider?: boolean
  }

  interface BrandColors {
    primary?: string
    primaryDark?: string
    primaryLight?: string
    primaryLighter?: string
    primaryHighlight?: string
    primaryBackground?: string
    brandPrimary?: string
    brandSecondary?: string
  }

  interface BrandingConfig {
    name: string
    appName: string
    package?: {
      homepage?: string
      description?: string
      author?: {
        name?: string
        email?: string
      }
      build?: {
        appId?: string
        copyright?: string
        productName?: string
      }
      repository?: {
        type: string
        url: string
      }
    }
    colors: {
      light: BrandColors
      dark: BrandColors
    }
  }

  interface BrandLogo {
    color?: Color
    darkMode?: boolean
  }
}

export {}
