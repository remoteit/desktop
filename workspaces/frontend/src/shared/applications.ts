/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/

import { replaceHost } from './nameHelper'

export const DEVICE_TYPE = 35

export class Application {
  context?: 'copy' | 'launch'
  title: string = 'URL'
  launchIcon: string = 'launch'
  commandIcon: string = 'terminal'
  publicTemplate: string = '[address]'
  addressTemplate: string = '[host]:[port]'
  defaultLaunchTemplate: string = 'http://[host]:[port]'
  defaultCommandTemplate: string = '[host]:[port]'
  defaultTokens: string[] = ['host', 'port', 'id']
  localhost?: boolean

  connection?: IConnection
  service?: IService

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
    return this.context === 'copy' ? this.commandIcon : this.launchIcon
  }

  get templateKey() {
    return this.context === 'copy' ? 'commandTemplate' : 'launchTemplate'
  }

  get contextTitle() {
    return this.context === 'copy' ? 'Command' : `Launch ${this.title}`
  }

  get defaultTemplate() {
    return this.context === 'copy' ? this.resolvedDefaultCommandTemplate : this.resolvedDefaultLaunchTemplate
  }

  get template() {
    return this.context === 'copy' ? this.commandTemplate : this.launchTemplate
  }

  get command() {
    return this.parse(this.template, this.lookup)
  }

  get address() {
    return this.parse(this.resolvedAddressTemplate, this.lookup)
  }

  get prompt() {
    return this.missingTokens.length
  }

  get tokens() {
    return this.extractTokens(this.launchTemplate + this.commandTemplate)
  }

  get allTokens() {
    return this.defaultTokens.concat(this.customTokens)
  }

  get customTokens() {
    return this.tokens.filter(token => !this.defaultTokens.includes(token))
  }

  get missingTokens() {
    return this.extractTokens(this.parse(this.template, this.lookup)) || []
  }

  get lookup() {
    let lookup: ILookup<any> = {}
    if (this.connection) lookup = { ...this.connection, ...lookup }
    if (this.service) lookup = { ...this.service.attributes, ...lookup }
    return lookup
  }

  private get resolvedAddressTemplate() {
    return this.connection?.public ? this.publicTemplate : this.addressTemplate
  }

  private get resolvedDefaultLaunchTemplate() {
    return this.connection?.public
      ? this.publicTemplate
      : this.service?.attributes.launchTemplate || this.defaultLaunchTemplate
  }

  private get resolvedDefaultCommandTemplate() {
    return this.connection?.public
      ? this.publicTemplate
      : this.service?.attributes.commandTemplate || this.defaultCommandTemplate || this.defaultLaunchTemplate
  }

  private get launchTemplate() {
    return this.connection?.launchTemplate || this.resolvedDefaultLaunchTemplate
  }

  private get commandTemplate() {
    return this.connection?.commandTemplate || this.resolvedDefaultCommandTemplate
  }

  private parse(template: string = '', lookup: ILookup<string>) {
    this.tokens.forEach(token => {
      if (lookup[token]) {
        const search = new RegExp(`\\[${token}\\]`, 'g')
        template = template.replace(search, encodeURI(lookup[token]))
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

export function getApplication(context: Application['context'], service?: IService, connection?: IConnection) {
  const app = getApplicationType(service?.typeID || connection?.typeID)

  app.context = context
  app.service = service
  app.connection = connection

  return app
}

function getApplicationType(typeID?: number) {
  switch (typeID) {
    case 4:
      return new Application({
        title: 'VNC',
        launchIcon: 'desktop',
        defaultLaunchTemplate: 'vnc://[username]@[host]:[port]',
      })
    case 28:
      return new Application({
        title: 'SSH',
        defaultLaunchTemplate: 'ssh://[username]@[host]:[port]',
        defaultCommandTemplate: 'ssh -l [username] [host] -p [port]',
        //'ssh -l [username] [host] -p [port] -o "NoHostAuthenticationForLocalhost=yes"',
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
