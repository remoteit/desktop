/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/

import { replaceHost } from './nameHelper'
import { getEnvironment, isPortal } from '../sharedAdaptor'

export const DEVICE_TYPE = 35

export enum LAUNCH_TYPE {
  URL = 'URL',
  COMMAND = 'COMMAND',
}

export class Application {
  title: string = ''
  launchIcon: string = 'launch'
  commandIcon: string = 'terminal'
  defaultLaunchType: LAUNCH_TYPE = LAUNCH_TYPE.URL
  reverseProxyTemplate: string = 'https://[host]'
  defaultLaunchTemplate: string = 'http://[host]:[port]'
  defaultCommandTemplate: string = '[host]:[port]'
  defaultAppTokens: string[] = ['host', 'port', 'id']
  defaultTokenData: ILookup<string> = {}
  localhost?: boolean

  connection?: IConnection
  service?: IService

  isPortal: boolean = isPortal()

  REGEX_PARSE: RegExp = /\[[^\W\[\]]+\]/g

  constructor(options: { [key in keyof Application]?: any }) {
    Object.assign(this, options)
  }

  value(token: string) {
    return this.lookup[token]
  }

  preview(data: ILookup<string>) {
    return this.parse(this.template, { ...this.lookup, ...data })
  }

  get icon() {
    return this.launchType === LAUNCH_TYPE.COMMAND ? this.commandIcon : this.launchIcon
  }

  get templateKey() {
    return this.launchType === LAUNCH_TYPE.COMMAND ? 'commandTemplate' : 'launchTemplate'
  }

  get contextTitle() {
    return this.launchType === LAUNCH_TYPE.COMMAND ? this.commandTitle : this.launchTitle
  }

  get commandTitle() {
    return `${this.title} Command`
  }

  get launchTitle() {
    return `${this.title} URL`
  }

  get defaultTemplate() {
    return this.launchType === LAUNCH_TYPE.COMMAND
      ? this.resolvedDefaultCommandTemplate
      : this.resolvedDefaultLaunchTemplate
  }

  get template() {
    return this.launchType === LAUNCH_TYPE.COMMAND ? this.commandTemplate : this.launchTemplate
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
        const replace = this.launchType === LAUNCH_TYPE.URL ? encodeURI(lookup[token]) : lookup[token]
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
  const { os } = getEnvironment()
  switch (typeId) {
    case 4:
      return new Application({
        title: 'VNC',
        launchIcon: 'desktop',
        defaultLaunchType: os === 'windows' ? LAUNCH_TYPE.COMMAND : LAUNCH_TYPE.URL,
        defaultLaunchTemplate: 'vnc://[username]@[host]:[port]',
        defaultCommandTemplate: os === 'windows' ? '"[path]" -Username [username] [host]:[port]' : '',
      })
    case 28:
      return new Application({
        title: 'SSH',
        defaultLaunchType: os === 'windows' ? LAUNCH_TYPE.COMMAND : LAUNCH_TYPE.URL,
        defaultLaunchTemplate: 'ssh://[username]@[host]:[port]',
        defaultCommandTemplate:
          os === 'windows' ? 'start cmd /k ssh [username]@[host] -p [port]' : 'ssh -l [username] [host] -p [port]',
        defaultTokenData: { path: 'putty.exe' },
      })
    case 5:
      return new Application({
        title: 'Remote Desktop',
        defaultLaunchType: os === 'windows' ? LAUNCH_TYPE.COMMAND : LAUNCH_TYPE.URL,
        defaultLaunchTemplate: 'rdp://[username]@[host]:[port]',
        defaultCommandTemplate: os === 'windows' ? 'mstsc /v: [host]:[port]' : '[host]:[port]',
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
