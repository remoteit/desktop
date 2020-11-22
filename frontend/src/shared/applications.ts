/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/

import { replaceHost } from './nameHelper'

export class Application {
  types: number[] = []
  title: string = 'URL'
  icon: string = 'arrow-right'
  context?: 'copy' | 'launch'
  defaultLaunchTemplate: string = 'http://[host]:[port]'
  defaultCommandTemplate: string = '[host]:[port]'
  defaultTokens: string[] = ['host', 'port', 'id']
  iconRotate: boolean = false

  connection?: IConnection
  service?: IService

  REGEX_PARSE: RegExp = /\[[^\W\[\]]+\]/g

  constructor(options: { [key in keyof Application]?: any }) {
    Object.assign(this, options)
  }

  get contextTitle() {
    return this.context === 'copy' ? 'Copy Command' : 'Launch URL'
  }

  get template() {
    return this.context === 'copy' ? this.commandTemplate : this.launchTemplate
  }

  get command() {
    return this.parse(this.template)
  }

  get prompt() {
    return this.missingTokens(this.template).length
  }

  get tokens() {
    return this.extractTokens(this.launchTemplate + this.commandTemplate)
  }

  get customTokens() {
    return this.tokens.filter(token => !this.defaultTokens.includes(token))
  }

  get data() {
    let data: ILookup<string> = {}
    for (const token in this.missingTokens(this.template)) data[token] = ''
    return data
  }

  private get launchTemplate() {
    return this.connection?.launchTemplate || this.service?.attributes.launchTemplate || this.defaultLaunchTemplate
  }

  private get commandTemplate() {
    return (
      this.connection?.commandTemplate ||
      this.service?.attributes.commandTemplate ||
      this.defaultCommandTemplate ||
      this.defaultLaunchTemplate
    )
  }

  private missingTokens(template: string) {
    return this.extractTokens(this.parse(template)) || []
  }

  private parse(template: string = '') {
    let lookup: ILookup<any> = this.connection || {}
    if (this.service) lookup = { ...this.service.attributes, ...lookup }
    for (const key in lookup) if (lookup[key]) template = template.replace(`[${key}]`, encodeURI(lookup[key]))
    template = replaceHost(template)
    return template
  }

  private extractTokens(template: string) {
    const matches: string[] = (template.match(this.REGEX_PARSE) || []).map(m => m.slice(1, -1))
    const unique = new Set(matches)
    return [...Array.from(unique)]
  }
}

class DefaultApp extends Application {
  types = []
  title = 'URL'
  icon = 'arrow-right'
  iconRotate = true
}

export function useApplicationService(context: Application['context'], service?: IService, connection?: IConnection) {
  const app = useApplication(service?.typeID || connection?.typeID)

  app.context = context
  app.service = service
  app.connection = connection

  return app
}

export function useApplication(typeID?: number) {
  let app: Application

  switch (typeID) {
    case 4:
      app = new Application({
        title: 'VNC',
        icon: 'desktop',
        defaultLaunchTemplate: 'vnc://[host]:[port]',
      })
      break
    case 28:
      app = new Application({
        title: 'SSH',
        icon: 'terminal',
        defaultLaunchTemplate: 'ssh://[username]@[host]:[port]',
        defaultCommandTemplate:
          'ssh -l [username] [host] -p [port] -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile /dev/null"',
      })
      break
    case 8:
    case 10:
    case 33:
      app = new Application({
        title: 'Secure Browser',
        icon: 'arrow-right',
        iconRotate: true,
        defaultLaunchTemplate: 'https://[host]:[port]',
      })
      break
    case 7:
    case 30:
    case 38:
    case 42:
      app = new Application({
        title: 'Browser',
        icon: 'arrow-right',
        iconRotate: true,
      })
      break
    case 34:
      app = new Application({
        types: [34],
        title: 'Samba',
        icon: 'folder',
        defaultLaunchTemplate: 'smb://[host]:[port]',
      })
      break
    default:
      app = new DefaultApp({})
  }

  return app
}

export default useApplication
