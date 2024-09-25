import { adaptor } from './adaptor'
import { replaceHost } from './nameHelper'

export const DEVICE_TYPE = 35
export const KEY_APPS = new Set([5, 7, 8, 28, 48, 49])

class LaunchMethod {
  type: Exclude<IConnection['launchType'], undefined> = 'NONE'
  icon: string = ''
  name: string = ''
  template: string = ''
  defaultTemplate: string = ''
  copyIcon?: string = ''
  sshConfig?: string
  disconnect?: string
  disconnectDisplay?: string

  constructor(options?: Partial<{ [key in keyof LaunchMethod]: LaunchMethod[key] }>) {
    this.setDefaults()
    if (options) {
      options.defaultTemplate = options.defaultTemplate || options.template
      Object.assign(this, options)
    }
  }

  setDefaults() {
    // intended to be used by child classes
  }

  get form() {
    return { key: this.type, name: this.name }
  }
}

class UrlLaunchMethod extends LaunchMethod {
  setDefaults() {
    this.type = 'URL'
    this.icon = 'launch'
    this.copyIcon = 'link-horizontal'
    this.name = 'URL'
    this.template = 'https://[host]:[port]'
  }
}

class CommandLaunchMethod extends LaunchMethod {
  setDefaults() {
    this.type = 'COMMAND'
    this.icon = 'code-simple'
    this.name = 'Command'
    this.template = '[host]:[port]'
  }
}

class TerminalLaunchMethod extends LaunchMethod {
  setDefaults() {
    this.type = 'TERMINAL'
    this.icon = 'terminal'
    this.name = 'Terminal'
    this.template = '[host]:[port]'
  }
}

class ScriptLaunchMethod extends LaunchMethod {
  setDefaults() {
    this.type = 'SCRIPT'
    this.icon = 'code-simple'
    this.name = 'Script'
    this.template = ''
  }
}

export class Application {
  title: string = ''
  use: string = ''
  urlForm: boolean = false
  sshConfig: boolean = false
  appLaunchType: IConnection['launchType'] = 'NONE'
  launchMethods: LaunchMethod[] = [new UrlLaunchMethod(), new TerminalLaunchMethod(), new CommandLaunchMethod()]
  defaultAppTokens: string[] = ['host', 'port', 'id']
  defaultTokenData: ILookup<string> = {}
  globalDefaults: ILookup<any> = {}
  cloudData?: IApplicationType
  localhost?: boolean
  helpMessage?: string
  autoLaunch?: boolean
  autoClose?: boolean // run command on disconnect
  canShare?: boolean

  connection?: IConnection
  service?: IService

  windows: boolean = false
  portal: boolean = false

  REGEX_PARSE: RegExp = /\[[^\W\[\]]+\]/g

  constructor(options: Partial<{ [key in keyof Application]: Application[key] }>) {
    const environment = adaptor?.getState().environment
    const portal = environment?.portal
    const os = environment?.os
    options.windows = os === 'windows'
    options.portal = !!portal
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
    return !(this.portal && this.launchType !== 'URL') && this.launchType !== 'NONE'
  }

  get icon() {
    return this.launchMethod.icon
  }

  get copyIcon() {
    return this.launchMethod.copyIcon || this.icon
  }

  get contextTitle() {
    return `${this.title} ${this.launchMethod.name}`
  }

  get commandTitle() {
    return `${this.title} Command`
  }

  get launchTitle() {
    return `${this.title} URL`
  }

  get launchMethod(): LaunchMethod {
    return this.getLaunchMethod(this.launchType)
  }

  get commandLaunchMethod(): LaunchMethod {
    return this.getLaunchMethod('COMMAND')
  }

  get urlLaunchMethod(): LaunchMethod {
    return this.getLaunchMethod('URL')
  }

  get defaultTemplate() {
    return this.launchMethod.defaultTemplate // need resolved
  }

  get template() {
    return this.getTemplate(this.launchType)
  }

  get launchTemplate() {
    return this.getTemplate('URL')
  }

  get commandTemplate() {
    return this.getTemplate('COMMAND')
  }

  get string() {
    return this.parse(this.template, this.lookup)
  }

  get sshConfigString() {
    return this.parse(this.launchMethod?.sshConfig || this.template, this.lookup)
  }

  get commandString() {
    return this.parse(this.commandTemplate, this.lookup)
  }

  get launchString() {
    return this.parse(this.launchTemplate, this.lookup)
  }

  get disconnectString() {
    return this.parse(this.launchMethod.disconnect, this.lookup)
  }

  get prompt() {
    return this.missingTokens.length
  }

  get tokens() {
    return this.extractTokens(this.template)
  }

  get allTokens() {
    return this.extractTokens(this.launchMethods.map(method => this.getTemplate(method.type)).join())
  }

  get commandTokens() {
    return this.extractTokens(this.commandTemplate)
  }

  get launchTokens() {
    return this.extractTokens(this.launchTemplate)
  }

  get launchType() {
    return this.connection?.launchType || this.defaultLaunchType || 'NONE'
  }

  get defaultLaunchType(): IConnection['launchType'] {
    return this.globalDefaults?.launchType || this.appLaunchType
  }

  get defaultCommandTemplate() {
    return this.commandLaunchMethod.template
  }

  get defaultLaunchTemplate() {
    return this.urlLaunchMethod.template
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

  private getTemplate(type: LaunchMethod['type']) {
    if (this.connection?.connectLink) return this.resolvedDefaultTemplate(type)
    return this.connection?.launchTemplates?.[type] || this.resolvedDefaultTemplate(type)
  }

  private resolvedDefaultTemplate(type?: LaunchMethod['type']): string {
    switch (type) {
      case 'URL':
        return (
          this.service?.attributes.launchTemplate || this.globalDefaults.launchTemplate || this.defaultLaunchTemplate
        )
      case 'COMMAND':
        return (
          this.service?.attributes.commandTemplate || this.globalDefaults.commandTemplate || this.defaultCommandTemplate
        )
      default:
        return this.launchMethod.defaultTemplate
    }
  }

  private getLaunchMethod(type?: LaunchMethod['type']) {
    return this.launchMethods.find(method => method.type === type) || this.launchMethods[0]
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

  // Handle legacy connection templates
  if (connection && !connection.launchTemplates) {
    if (connection.launchTemplate) connection.launchTemplates = { URL: connection.launchTemplate }
    if (connection.commandTemplate) connection.launchTemplates = { COMMAND: connection.commandTemplate }
  }

  // Handle connect links
  if (app.connection?.connectLink && service?.link?.url) {
    const url = service.link.url
    app.title = app.reverseProxy ? 'Public' : 'Unauthenticated'
    app.canShare = true
    app.launchMethods = [new UrlLaunchMethod({ template: url }), new CommandLaunchMethod({ template: url })]
    app.appLaunchType = app.reverseProxy ? 'URL' : 'NONE'
  }

  return app
}

export function getApplicationType(typeId?: number) {
  const { environment, preferences } = adaptor?.getState() || {}
  const { sshConfig } = preferences || {}
  const portal = environment?.portal // includes mobile
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
      const launchMethods = [new UrlLaunchMethod({ template: 'vnc://[username]@[host]:[port]', icon: 'desktop' })]
      if (windows || mac)
        launchMethods.push(
          new CommandLaunchMethod({
            template: windows
              ? '"[path]" -Username "[username]" [host]:[port]'
              : 'open -a "[app]" --args -Username [username] [host]:[port]',
          })
        )
      return new Application({
        title: 'VNC',
        use: 'Ideal for remote desktop access to graphical interfaces on computers or servers. Use when you need to control a device with a graphical desktop remotely.',
        appLaunchType: windows ? 'COMMAND' : 'URL',
        defaultTokenData: windows ? undefined : { app: 'VNC Viewer' },
        launchMethods,
      })
    case 28:
      return new Application({
        title: 'SSH',
        use: 'For secure terminal access and command-line execution on servers or devices. Essential for system admins and developers.',
        autoLaunch: !(windows && portal),
        appLaunchType: portal && !windows ? 'URL' : 'TERMINAL',
        launchMethods: [
          new UrlLaunchMethod({ template: 'ssh://[username]@[host]:[port]' }),
          new TerminalLaunchMethod({
            template: sshConfig
              ? 'ssh_config [User]'
              : windows
              ? 'ssh [username]@[host] -p [port]'
              : 'ssh -l [username] [host] -p [port]',
            sshConfig: sshConfig ? 'ssh [host]' : undefined,
          }),
        ],
        helpMessage: sshConfig ? 'Any ssh config attribute may be added' : undefined,
        sshConfig,
      })
    case 5:
      const rdpCommand = 'rdp://full%20address=s%3A[host]%3A[port]&username=s%3A[username]'
      return new Application({
        title: 'RDP',
        use: 'For remote desktop access to Windows servers or devices. Use when you need to control a device with a graphical desktop remotely.',
        appLaunchType: ios || android ? 'URL' : 'COMMAND',
        defaultTokenData: windows ? undefined : { app: 'Microsoft Remote Desktop' },
        launchMethods: [
          new UrlLaunchMethod({ template: rdpCommand }),
          new CommandLaunchMethod({
            template: windows ? 'mstsc /v: [host]:[port]' : mac ? `open -a "[app]" "${rdpCommand}"` : rdpCommand,
          }),
        ],
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
        localhost: true,
        appLaunchType: 'URL',
        launchMethods: [
          new UrlLaunchMethod({ template: 'smb://[host]:[port]', icon: 'folder' }),
          new CommandLaunchMethod({
            template: windows ? '\\\\[host]:[port]' : '[host]:[port]',
            name: 'Copy command',
            icon: 'clipboard',
          }),
        ],
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
          !!device && [0, 5, 10, 1120, 1076, 256, 769, 1121, 1200, 1185].includes(device?.targetPlatform),
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
        launchMethods: [
          new UrlLaunchMethod({ template: 'https://[host]:[port]' }),
          new CommandLaunchMethod({
            template: windows ? 'start cmd /k docker -H [host]:[port] ps' : 'docker -H [host]:[port] ps',
          }),
        ],
      })
    case 48:
      return new Application({
        title: 'ScreenView',
        use: 'Use for remote screen viewing or control via Remote.It’s ScreenView app. Facilitates support, collaboration and remote access.',
        appLaunchType: 'URL',
        autoLaunch: true,
        visibility: (device?: IDevice) =>
          !!(device?.targetPlatform === 1213 || device?.supportedAppInstalls.includes(typeId)),
      })
    case 49:
      return new Application({
        title: 'SOCKS Proxy (Alpha)',
        use: 'Use as a proxy server for handling internet traffic via the SOCKS protocol. Provides secure and anonymous communication, allowing users to bypass internet restrictions and protect their online privacy.',
        defaultTokenData: windows ? undefined : { app: 'Google Chrome' },
        appLaunchType: portal ? 'NONE' : 'SCRIPT',
        autoClose: true,
        autoLaunch: true,
        launchMethods: [
          new ScriptLaunchMethod({
            name: 'Browser',
            template: windows
              ? 'socks.ps1 -path "[app]" -proxy "socks5://[host]:[port]"'
              : 'socks.sh "[app]" "socks5://[host]:[port]"',
            disconnect: windows ? 'socks.ps1 -path "[app]"' : 'socks.sh "[app]"',
            disconnectDisplay: 'Restarts your browser to remove SOCKS Proxy on disconnect',
          }),
          // new ScriptLaunchMethod({
          //   template:
          //     'networksetup -setsocksfirewallproxy Wi-Fi [host] [port] && networksetup -setsocksfirewallproxystate Wi-Fi on',
          //   disconnect:
          //     'networksetup -setsocksfirewallproxystate Wi-Fi off && networksetup -setsocksfirewallproxystate Ethernet off',
          //   disconnectDisplay: 'Turns off system SOCKS Proxy on disconnect',
          // }),
        ],
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
