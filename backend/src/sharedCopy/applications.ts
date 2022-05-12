/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/

import { replaceHost } from './nameHelper'
import { getEnvironment, isPortal } from '../sharedAdaptor'

export const DEVICE_TYPE = 35

export type LAUNCH_TYPE = 'COMMAND' | 'URL'

export class Application {
  title: string = ''
  launchIcon: string = 'launch'
  commandIcon: string = 'terminal'
  defaultLaunchType: LAUNCH_TYPE = 'URL'
  windowsLaunchType: LAUNCH_TYPE = 'COMMAND'
  reverseProxyTemplate: string = 'https://[host]'
  defaultLaunchTemplate: string = 'http://[host]:[port]'
  defaultCommandTemplate: string = '[host]:[port]'
  windowsCommandTemplate?: string
  defaultAppTokens: string[] = ['host', 'port', 'id']
  defaultTokenData: ILookup<string> = {}
  localhost?: boolean

  connection?: IConnection
  service?: IService

  isPortal: boolean = isPortal()

  REGEX_PARSE: RegExp = /\[[^\W\[\]]+\]/g

  constructor(options: { [key in keyof Application]?: any }) {
    const { os } = getEnvironment()
    if (os === 'windows') {
      options.defaultLaunchType = options.windowsLaunchType || options.defaultLaunchType || this.windowsLaunchType
      options.defaultCommandTemplate =
        options.windowsCommandTemplate ||
        options.defaultCommandTemplate ||
        this.windowsCommandTemplate ||
        this.defaultCommandTemplate
    }
    Object.assign(this, options)
  }

  value(token: string) {
    return this.lookup[token]
  }

  preview(data: ILookup<string>) {
    return this.parse(this.template, { ...this.lookup, ...data })
  }

  get canLaunch() {
    const { portal } = getEnvironment()
    return !(portal && this.launchType === 'COMMAND')
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
    return this.connection?.launchTemplate || this.resolvedDefaultLaunchTemplate
  }

  get commandTemplate() {
    return this.connection?.commandTemplate || this.resolvedDefaultCommandTemplate
  }

  get string() {
    return this.parse(this.template, this.lookup)
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

  get defaultTokens() {
    return this.defaultAppTokens
  }

  get allCustomTokens() {
    return this.allTokens.filter(token => !this.defaultTokens.includes(token))
  }

  get customTokens() {
    return this.tokens.filter(token => !this.defaultTokens.includes(token))
  }

  get missingTokens() {
    return this.extractTokens(this.parse(this.template, this.lookup)) || []
  }

  get lookup() {
    let lookup: ILookup<any> = { ...this.defaultTokenData }
    if (this.service) lookup = { ...lookup, ...this.service.attributes }
    if (this.connection) lookup = { ...lookup, ...this.connection }
    return lookup
  }

  private get resolvedDefaultLaunchTemplate() {
    return this.connection?.reverseProxy
      ? this.reverseProxyTemplate
      : this.service?.attributes.launchTemplate || this.defaultLaunchTemplate
  }

  private get resolvedDefaultCommandTemplate() {
    return this.service?.attributes.commandTemplate || this.defaultCommandTemplate || this.defaultLaunchTemplate
  }

  private parse(template: string = '', lookup: ILookup<string>) {
    this.allTokens.forEach(token => {
      if (lookup[token]) {
        const search = new RegExp(`\\[${token}\\]`, 'g')
        const replace = this.launchType === 'URL' ? encodeURI(lookup[token]) : lookup[token]
        template = template.replace(search, replace)
      }
    })
    template = replaceHost(template, this.localhost)
    return template
  }

  private extractTokens(template: string) {
    const matches: string[] = (template.match(this.REGEX_PARSE) || []).map(m => m.slice(1, -1))
    const unique = new Set(matches)
    return [...Array.from(unique)]
  }
}

export function getApplication(service?: IService, connection?: IConnection) {
  const app = getApplicationType(service?.typeID || connection?.typeID)

  app.service = service
  app.connection = connection

  return app
}

function getApplicationType(typeId: number | undefined) {
  switch (typeId) {
    case 4:
      return new Application({
        title: 'VNC',
        launchIcon: 'desktop',
        defaultLaunchType: 'COMMAND',
        windowsLaunchType: 'COMMAND',
        defaultLaunchTemplate: 'vnc://[username]@[host]:[port]',
        defaultCommandTemplate: '[path] -Username [username] [host]:[port]',
        windowsCommandTemplate: '"[path]" -Username [username] [host]:[port]',
      })
    case 28:
      return new Application({
        title: 'SSH',
        defaultLaunchType: 'URL',
        windowsLaunchType: 'COMMAND',
        defaultLaunchTemplate: 'ssh://[username]@[host]:[port]',
        defaultCommandTemplate: 'ssh -l [username] [host] -p [port]',
        windowsCommandTemplate: 'start cmd /k ssh [username]@[host] -p [port]',
        defaultTokenData: { path: 'putty.exe' },
      })
    case 5:
      return new Application({
        title: 'RDP',
        defaultLaunchType: 'URL',
        windowsLaunchType: 'COMMAND',
        defaultLaunchTemplate: 'rdp://[username]@[host]:[port]',
        defaultCommandTemplate: '[host]:[port]',
        windowsCommandTemplate: 'mstsc /v: [host]:[port]',
      })
    case 8:
    case 10:
    case 33:
      return new Application({
        title: 'Secure Browser',
        defaultLaunchTemplate: 'https://[host]:[port]',
      })
    case 7:
    case 30:
    case 38:
    case 42:
      return new Application({
        title: 'Browser',
      })
    case 34:
      return new Application({
        title: 'Samba',
        launchIcon: 'folder',
        commandIcon: 'clipboard',
        localhost: true,
        defaultLaunchTemplate: 'smb://[host]:[port]',
      })
    default:
      return new Application({})
  }
}
