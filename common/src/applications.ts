import { adaptor } from './adaptor'
import { replaceHost } from './nameHelper'

export const DEVICE_TYPE = 35
export const KEY_APPS = new Set([4, 5, 7, 8, 28, 49])

export class Application {
  title: string = ''
  use: string = ''
  launchIcon: string = 'launch'
  commandIcon: string = 'terminal'
  urlForm: boolean = false
  sshConfig: boolean = false
  appLaunchType: IConnection['launchType'] = 'NONE'
  appCommandTemplate: string = '[host]:[port]'
  appLaunchTemplate: string = 'https://[host]:[port]'
  displayTemplate?: string
  defaultAppTokens: string[] = ['host', 'port', 'id']
  defaultTokenData: ILookup<string> = {}
  globalDefaults: ILookup<any> = {}
  cloudData?: IApplicationType
  localhost?: boolean
  helpMessage?: string
  autoLaunch?: boolean
  canShare?: boolean

  connection?: IConnection
  service?: IService

  windows: boolean = false
  portal: boolean = false

  REGEX_PARSE: RegExp = /\[[^\W\[\]]+\]/g

  constructor(options: { [key in keyof Application]?: any }) {
    const environment = adaptor?.getState().environment
    const portal = environment?.portal
    const os = environment?.os
    options.windows = os === 'windows'
    options.portal = portal
    Object.assign(this, options)
  }

  value(token: string) {
    return this.lookup[token]
  }

  preview(data: ILookup<string>) {
    return this.parse(this.template, { ...this.lookup, ...data })
  }

  visibility(device?: IDevice) {
    return true
  }

  get canLaunch() {
    return !(this.portal && this.launchType === 'COMMAND') && this.launchType !== 'NONE'
  }

  get icon() {
    return this.launchType === 'COMMAND' ? this.commandIcon : this.launchIcon
  }

  get templateKey() {
    return this.launchType === 'COMMAND' ? 'commandTemplate' : 'launchTemplate'
  }

  get contextTitle() {
    return this.launchType === 'COMMAND' ? this.commandTitle : this.launchTitle
  }

  get commandTitle() {
    return `${this.title} Command`
  }

  get launchTitle() {
    return `${this.title} URL`
  }

  get defaultTemplate() {
    return this.launchType === 'COMMAND' ? this.resolvedDefaultCommandTemplate : this.resolvedDefaultLaunchTemplate
  }

  get template() {
    return this.launchType === 'COMMAND' ? this.commandTemplate : this.launchTemplate
  }

  get launchTemplate() {
    if (this.connection?.connectLink) return this.resolvedDefaultLaunchTemplate
    return this.connection?.launchTemplate || this.resolvedDefaultLaunchTemplate
  }

  get commandTemplate() {
    if (this.connection?.connectLink) return this.resolvedDefaultCommandTemplate
    return this.connection?.commandTemplate || this.resolvedDefaultCommandTemplate
  }

  get string() {
    return this.parse(this.template, this.lookup)
  }

  get displayString() {
    return this.parse(this.displayTemplate || this.template, this.lookup)
  }

  get commandString() {
    return this.parse(this.commandTemplate, this.lookup)
  }

  get launchString() {
    return this.parse(this.launchTemplate, this.lookup)
  }

  get prompt() {
    return this.missingTokens.length
  }

  get tokens() {
    return this.extractTokens(this.template)
  }

  get allTokens() {
    return this.extractTokens(this.commandTemplate + this.launchTemplate)
  }

  get commandTokens() {
    return this.extractTokens(this.commandTemplate)
  }

  get launchTokens() {
    return this.extractTokens(this.launchTemplate)
  }

  get launchType() {
    return this.connection?.launchType || this.defaultLaunchType
  }

  get defaultLaunchType(): IConnection['launchType'] {
    return this.globalDefaults?.launchType || this.appLaunchType
  }

  get defaultCommandTemplate() {
    return this.appCommandTemplate
  }

  get defaultLaunchTemplate() {
    return this.appLaunchTemplate
  }

  get defaultTokens() {
    return this.defaultAppTokens
  }

  get customTokens() {
    return this.tokens.filter(token => !this.defaultTokens.includes(token))
  }

  get launchCustomTokens() {
    return this.launchTokens.filter(token => !this.defaultTokens.includes(token))
  }

  get commandCustomTokens() {
    return this.commandTokens.filter(token => !this.defaultTokens.includes(token))
  }

  get allCustomTokens() {
    return this.allTokens.filter(token => !this.defaultTokens.includes(token))
  }

  get missingTokens() {
    return this.extractTokens(this.parse(this.template, this.lookup)) || []
  }

  get lookup() {
    let lookup: ILookup<any> = { ...this.defaultTokenData, ...this.globalDefaults }
    if (this.service) lookup = { ...lookup, ...this.service.attributes }
    if (this.connection) lookup = { ...lookup, ...this.connection }
    return lookup
  }

  get reverseProxy() {
    return this.cloudData ? this.cloudData.proxy : false
  }

  getReverseProxyTemplate(secure: boolean) {
    return secure ? this.template.replace('http:', 'https:') : this.template.replace('https:', 'http:')
  }

  private get resolvedDefaultLaunchTemplate(): string {
    return this.service?.attributes.launchTemplate || this.globalDefaults.launchTemplate || this.defaultLaunchTemplate
  }

  private get resolvedDefaultCommandTemplate(): string {
    return (
      this.service?.attributes.commandTemplate ||
      this.globalDefaults.commandTemplate ||
      this.defaultCommandTemplate ||
      this.defaultLaunchTemplate
    )
  }

  private parse(template: string = '', lookup: ILookup<string>) {
    this.allTokens.forEach(token => {
      if (lookup[token]) {
        const search = new RegExp(`\\[${token}\\]`, 'g')
        const replace = lookup[token]
        template = template.replace(search, replace)
      }
    })
    template = replaceHost(template, this.localhost)
    if (!lookup.port) template = template.replace(':[port]', '')
    return template
  }

  private extractTokens(template: string) {
    const matches: string[] = (template.match(this.REGEX_PARSE) || []).map(m => m.slice(1, -1))
    const unique = new Set(matches)
    return [...Array.from(unique)]
  }
}

export function getApplication(service?: IService, connection?: IConnection, globalDefaults?: ILookup<any>) {
  const typeID = service?.typeID || connection?.typeID
  const app = getApplicationType(typeID)

  app.service = service
  app.connection = connection
  app.globalDefaults = globalDefaults?.[typeID || ''] || {}
  app.cloudData = adaptor?.getCloudData(typeID)

  // Handle connect links
  if (app.connection?.connectLink && service?.link?.url) {
    const url = service.link.url
    app.title = app.reverseProxy ? 'Public' : 'Unauthenticated'
    app.canShare = true
    app.appCommandTemplate = url
    app.appLaunchTemplate = url
    app.appLaunchType = app.reverseProxy ? 'URL' : 'NONE'
  }

  return app
}

export function getApplicationType(typeId?: number) {
  const { environment, preferences } = adaptor?.getState() || {}
  const { sshConfig } = preferences || {}
  const portal = environment?.portal
  const os = environment?.os
  const windows = os === 'windows'
  const android = os === 'android'
  const mac = os === 'mac'
  const ios = os === 'ios'

  switch (typeId) {
    case 1:
      return new Application({
        title: 'TCP',
        appLaunchType: 'URL',
        use: 'Use for custom TCP connections not involving web traffic, as it lacks reverse proxy capabilities. Ideal for direct application-to-application communication.',
      })
    case 4:
      return new Application({
        title: 'VNC',
        launchIcon: 'desktop',
        use: 'Ideal for remote desktop access to graphical interfaces on computers or servers. Use when you need to control a device with a graphical desktop remotely.',
        appLaunchType: ios || android || mac ? 'URL' : 'COMMAND',
        defaultTokenData: { app: windows ? undefined : 'VNC Viewer' },
        appLaunchTemplate: 'vnc://[username]@[host]:[port]',
        appCommandTemplate: windows
          ? '"[path]" -Username "[username]" [host]:[port]'
          : mac
          ? 'open -a "[app]" --args -Username [username] [host]:[port]'
          : 'vnc://[host]:[port]',
      })
    case 28:
      return new Application({
        title: 'SSH',
        use: 'For secure terminal access and command-line execution on servers or devices. Essential for system admins and developers.',
        autoLaunch: !(windows && portal),
        appLaunchType: (portal && !windows) || ios || android ? 'URL' : 'COMMAND',
        appLaunchTemplate: 'ssh://[username]@[host]:[port]',
        appCommandTemplate: sshConfig
          ? 'ssh_config [User]'
          : windows
          ? 'start cmd /k ssh [username]@[host] -p [port]'
          : 'ssh -l [username] [host] -p [port]',
        displayTemplate: sshConfig && (windows ? 'start cmd /k ssh [host]' : 'ssh [host]'),
        helpMessage: sshConfig ? 'Any ssh config attribute may be added' : undefined,
        sshConfig,
      })
    case 5:
      const rdpCommand = 'rdp://full%20address=s%3A[host]%3A[port]&username=s%3A[username]'
      return new Application({
        title: 'RDP',
        use: 'For remote desktop access to Windows servers or devices. Use when you need to control a device with a graphical desktop remotely.',
        appLaunchType: ios || android ? 'URL' : 'COMMAND',
        defaultTokenData: { app: windows ? undefined : 'Microsoft Remote Desktop' },
        appLaunchTemplate: rdpCommand,
        appCommandTemplate: windows ? 'mstsc /v: [host]:[port]' : mac ? `open -a "[app]" "${rdpCommand}"` : rdpCommand,
      })
    case 8:
    case 10:
    case 33:
      return new Application({
        title: 'Secure Browser',
        use: 'Essential for any web application handling sensitive data, or any content requiring secure communication over the internet.',
        appLaunchType: 'URL',
        urlForm: true,
        autoLaunch: true,
      })
    case 7:
    case 30:
      return new Application({
        title: 'Browser',
        use: 'Use for accessing or hosting web applications that do not support encrypted connections. Ideal for local development environments or internal networks where security is not a concern.',
        appLaunchType: 'URL',
        urlForm: true,
        autoLaunch: true,
      })
    case 34:
      return new Application({
        title: 'Samba',
        use: 'Utilize for setting up shared access to files, printers, and serial ports within a Windows network or across different operating systems supporting SMB protocol.',
        launchIcon: 'folder',
        commandIcon: 'clipboard',
        localhost: true,
        appLaunchType: 'URL',
        appLaunchTemplate: 'smb://[host]:[port]',
        appCommandTemplate: windows ? '\\\\[host]:[port]' : '[host]:[port]',
      })
    case 37:
      return new Application({
        title: 'NxWitness',
        use: 'Use for connecting to Nx Witness Video Management Systems (VMS), suitable for security professionals managing IP camera networks.',
        appLaunchType: 'URL',
        urlForm: true,
        autoLaunch: true,
      })
    case 38:
      return new Application({
        title: 'Nextcloud',
        use: 'Select for secure access to Nextcloud hubs, allowing for file sharing, collaboration, and communication within a secure, private cloud environment.',
        appLaunchType: 'URL',
        urlForm: true,
        autoLaunch: true,
      })
    case 39:
      return new Application({
        title: 'OpenVPN',
        use: 'Choose for secure VPN access to networks, allowing for remote work or access to network resources with encryption.',
      })
    case 41:
      return new Application({
        title: 'Minecraft',
        use: 'Set up for hosting or connecting to a Minecraft server using TCP for gameplay, allowing players to join your Minecraft world.',
      })
    case 42:
      return new Application({
        title: 'Admin Panel',
        use: 'Remote.It admin panel running on the device. Previously used to remotely manage a device’s configuration. Now most devices can be managed from the Remote.it app or web portal.',
        appLaunchType: 'URL',
        urlForm: true,
        autoLaunch: true,
        visibility: (device?: IDevice) =>
          device && [0, 5, 10, 1120, 1076, 256, 769, 1121, 1200, 1185].includes(device?.targetPlatform),
      })
    case 43:
      return new Application({
        title: 'Terraria',
        use: 'Set up for hosting or connecting to a Terraria game server, allowing players to explore, build, and adventure together in a unique 2D world.',
      })
    case 44:
      return new Application({
        title: 'Redis',
        use: 'Select for connecting to Redis servers, ideal for developers working with high-performance databases for caching and messaging.',
      })
    case 45:
      return new Application({
        title: 'MySQL',
        use: 'Utilize for remote access to MySQL databases. Ideal for developers and database administrators managing databases remotely.',
      })
    case 46:
      return new Application({
        title: 'PostgreSQL',
        use: 'Utilize for remote access to PostgreSQL databases, essential for database administrators and developers needing to manage data remotely.',
      })
    case 47:
      return new Application({
        title: 'Docker API',
        use: 'Use for remote management of Docker containers. Ideal for developers and system administrators who need to control Docker environments remotely.',
        appLaunchType: 'COMMAND',
        appCommandTemplate: windows ? 'start cmd /k docker -H [host]:[port] ps' : 'docker -H [host]:[port] ps',
      })
    case 48:
      return new Application({
        title: 'ScreenView',
        use: 'Use for remote screen viewing or control via Remote.It’s Android ScreenView app. Facilitates support, collaboration and remote access.',
        appLaunchType: 'URL',
        autoLaunch: true,
        visibility: (device?: IDevice) => device?.targetPlatform === 1213,
      })
    case 49:
      return new Application({
        title: 'SOCKS Proxy (Alpha)',
        use: 'Use as a proxy server for handling internet traffic via the SOCKS protocol. Provides secure and anonymous communication, allowing users to bypass internet restrictions and protect their online privacy.',
        defaultTokenData: { app: windows ? undefined : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
        appLaunchType: 'COMMAND',
        // C:\\\\Program Files (x86)\\GoogleChromeApplicationchrome.exe
        appCommandTemplate: windows
          ? '"[app]" --user-data-dir="%USERPROFILE%\\AppData\\Local\\remoteit\\Chrome-[host]" --proxy-server="socks://[host]:[port]"'
          : 'open -a "[app]" --user-data-dir=~/.remoteit/Chrome-[host] --proxy-server="socks://[host]:[port]"',
        autoLaunch: true,
        visibility: (device?: IDevice) => (device?.version || 0) >= 5.2,
      })
    case 32769:
      return new Application({
        title: 'UDP',
        use: 'Select for applications that require fast communication where reliability is less critical, such as streaming, gaming, or broadcasting.',
      })
    case 32770:
      return new Application({
        title: 'WireGuard',
        use: 'Choose for a modern, secure VPN connection, offering fast and secure access to private networks with ease of setup and management.',
      })
    case 32771:
      return new Application({
        title: 'Minecraft Bedrock',
        use: 'Choose for Minecraft Bedrock Edition servers, using UDP for gameplay on platforms like mobile and consoles, enabling players to connect and play together.',
      })
    default:
      return new Application({})
  }
}
