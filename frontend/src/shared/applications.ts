/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/

import { replaceHost } from './nameHelper'
import { getEnvironment, getCloudData } from '../sharedAdaptor'

export const DEVICE_TYPE = 35

export class Application {
  title: string = ''
  example: string = '127.0.0.1' // @TODO @benoit to add to applicationTypes api?
  launchIcon: string = 'launch'
  commandIcon: string = 'terminal'
  appLaunchType: IConnection['launchType'] = 'NONE'
  appCommandTemplate: string = '[host]:[port]'
  appLaunchTemplate: string = 'http://[host]:[port]'
  reverseProxyTemplate: string = 'https://[host]'
  defaultAppTokens: string[] = ['host', 'port', 'id']
  defaultTokenData: ILookup<string> = {}
  globalDefaults: ILookup<any> = {}
  cloudData?: IApplicationType
  localhost?: boolean

  connection?: IConnection
  service?: IService

  windows: boolean = false
  portal: boolean = false

  REGEX_PARSE: RegExp = /\[[^\W\[\]]+\]/g

  constructor(options: { [key in keyof Application]?: any }) {
    const { os, portal } = getEnvironment()
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

  get canLaunch() {
    return !(this.portal && this.launchType === 'COMMAND') && this.launchType !== 'NONE'
  }

  get canShare() {
    return !!this.connection?.connectLink
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
    return !!this.cloudData?.proxy
  }

  private get resolvedDefaultLaunchTemplate() {
    return this.reverseProxy
      ? this.reverseProxyTemplate
      : this.service?.attributes.launchTemplate || this.globalDefaults.launchTemplate || this.appLaunchTemplate
  }

  private get resolvedDefaultCommandTemplate() {
    return (
      this.service?.attributes.commandTemplate ||
      this.globalDefaults.commandTemplate ||
      this.defaultCommandTemplate ||
      this.appLaunchTemplate
    )
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

export function getApplication(service?: IService, connection?: IConnection, globalDefaults?: ILookup<any>) {
  const typeID = service?.typeID || connection?.typeID
  const app = getApplicationType(typeID)

  app.service = service
  app.connection = connection
  app.globalDefaults = globalDefaults?.[typeID || ''] || {}
  app.cloudData = getCloudData(typeID)

  return app
}

export function getApplicationType(typeId: number | undefined) {
  const { portal, os } = getEnvironment()
  const windows = os === 'windows'

  switch (typeId) {
    case 1:
      return new Application({
        appLaunchType: 'URL',
      })
    case 4:
      return new Application({
        title: 'VNC',
        example: 'ssh://localhost:5900',
        launchIcon: 'desktop',
        appLaunchType: 'COMMAND',
        appLaunchTemplate: 'vnc://[username]@[host]:[port]',
        appCommandTemplate: windows
          ? '"[path]" -Username [username] [host]:[port]'
          : '[path] -Username [username] [host]:[port]',
      })
    case 28:
      return new Application({
        title: 'SSH',
        example: 'ssh://127.0.0.1:22',
        appLaunchType: portal ? 'URL' : windows ? 'COMMAND' : 'URL',
        appLaunchTemplate: 'ssh://[username]@[host]:[port]',
        appCommandTemplate: windows
          ? 'start cmd /k ssh [username]@[host] -p [port]'
          : 'ssh -l [username] [host] -p [port]',
      })
    case 5:
      return new Application({
        title: 'RDP',
        example: 'rdp://localhost:3389',
        appLaunchType: windows ? 'COMMAND' : 'URL',
        appLaunchTemplate: 'rdp://[username]@[host]:[port]',
        appCommandTemplate: windows ? 'mstsc /v: [host]:[port]' : '[host]:[port]',
      })
    case 8:
    case 10:
    case 33:
      return new Application({
        title: 'Secure Browser',
        example: 'https://192.168.0.110:9000/admin',
        appLaunchType: 'URL',
        appLaunchTemplate: 'https://[host]:[port]',
      })
    case 7:
    case 30:
    case 37:
    case 38:
    case 42:
      return new Application({
        title: 'Browser',
        example: 'http://localhost:8001/api/dashboard',
        appLaunchType: 'URL',
      })
    case 34:
      return new Application({
        title: 'Samba',
        example: 'smb://localhost:445',
        launchIcon: 'folder',
        commandIcon: 'clipboard',
        localhost: true,
        appLaunchType: 'URL',
        appLaunchTemplate: 'smb://[host]:[port]',
        appCommandTemplate: windows ? '\\\\[host]:[port]' : '[host]:[port]',
      })
    default:
      return new Application({})
  }
}
