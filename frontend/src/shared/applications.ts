/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/

import { replaceHost } from './nameHelper'

export const DEVICE_TYPE = 35

export enum LAUNCH_TYPE {
  URL = 'URL',
  COMMAND = 'COMMAND'
}

export class Application {
  context?: 'copy' | 'launch'
  title: string = 'URL'
  launchIcon: string = 'launch'
  commandIcon: string = 'terminal'
  publicTemplate: string = '[address]'
  launchDarwin: string = ` osascript  -e 'tell application "Terminal" to do script " [commandTemplate] " ' `
  launchUnix: string = `gnome-terminal -- /bin/bash -c '[commandTemplate]; read' `
  defaultTemplateCmd: string = ''
  checkApplicationCmd: string = ''
  addressTemplate: string = '[host]:[port]'
  defaultLaunchType: LAUNCH_TYPE = LAUNCH_TYPE.URL
  defaultLaunchTemplate: string = 'http://[host]:[port]'
  defaultCommandTemplate: string = '[host]:[port]'
  defaultAppTokens: string[] = ['host', 'port', 'id']
  defaultPublicTokens: string[] = ['address', 'id']
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

  get templateCmd() {
    return this.launchTemplateCmd
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

  get launchType() {
    return this.connection?.launchType || this.defaultLaunchType
  }

  get defaultTokens() {
    return this.connection?.public ? this.defaultPublicTokens : this.defaultAppTokens
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

  private get resolvedDefaultLaunchTemplateCmd() {
    return this.defaultTemplateCmd
  }

  private get resolvedDefaultCommandTemplate() {
    return this.connection?.public
      ? this.publicTemplate
      : this.service?.attributes.commandTemplate || this.defaultCommandTemplate || this.defaultLaunchTemplate
  }

  private get launchTemplate() {
    return this.connection?.launchTemplate || this.resolvedDefaultLaunchTemplate
  }

  private get launchTemplateCmd() {
    return this.resolvedDefaultLaunchTemplateCmd
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
  const app = getApplicationType({
    typeId: service?.typeID || connection?.typeID,
    host: connection?.host,
    port: connection?.port,
    username: connection?.username,
  })

  app.context = context
  app.service = service
  app.connection = connection

  return app
}

function getApplicationType(connection: {
  typeId: number | undefined
  host: string | undefined
  port: number | undefined
  username: string | undefined
}) {
  switch (connection.typeId) {
    case 4:
      return new Application({
        title: 'VNC',
        launchIcon: 'desktop',
        defaultLaunchTemplate: 'vnc://[username]@[host]:[port]',
        defaultTemplateCmd: `start vncViewer.exe -Username [username] [host]:[port]`,
        checkApplicationCmd: 'cd c:\\ && where vncViewer.exe',
      })
    case 28:
      return new Application({
        title: 'SSH',
        defaultLaunchTemplate: 'ssh://[username]@[host]:[port]',
        defaultCommandTemplate: 'ssh -l [username] [host] -p [port]',
        defaultTemplateCmd: `start putty.exe -ssh [username]@[host] [port]`,
        checkApplicationCmd: 'cd c:\\ && where putty.exe ',
        //'ssh -l [username] [host] -p [port] -o "NoHostAuthenticationForLocalhost=yes"',
      })
    case 5:
      return new Application({
        title: 'remoteDesktop',
        defaultLaunchTemplate: 'http://[username]@[host]:[port]',
        defaultCommandTemplate: '',
        // defaultLaunchType: isWin() ? 'COMMAND' : 'URL',
        defaultTemplateCmd: `cmdkey /generic:[host] /user:[username] && mstsc /v: [host] && cmdkey /delete:TERMSRV/[host]`,
        checkApplicationCmd: 'cd c:\\ && where remoteDesktop.exe ',
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
