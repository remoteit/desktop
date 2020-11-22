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
  iconRotate: boolean = false

  connection?: IConnection
  service?: IService

  REGEX_PARSE: RegExp = /\[[^\]]*\]/g

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
    return this.parse(this.commandTemplate)
  }

  get prompt() {
    return this.missingTokens(this.template).length
  }

  get tokens() {
    return this.extractTokens(this.launchTemplate + this.commandTemplate)
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

const applications: Application[] = [
  new Application({
    types: [4],
    title: 'VNC',
    icon: 'desktop',
    defaultLaunchTemplate: 'vnc://[host]:[port]',
  }),
  new Application({
    types: [28],
    title: 'SSH',
    icon: 'terminal',
    defaultLaunchTemplate: 'ssh://[username]@[host]:[port]',
    defaultCommandTemplate:
      'ssh -l [username] [host] -p [port] -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile /dev/null"',
  }),
  new Application({
    types: [8, 10, 33],
    title: 'Secure Browser',
    icon: 'arrow-right',
    iconRotate: true,
    defaultLaunchTemplate: 'https://[host]:[port]',
  }),
  new Application({
    types: [7, 30, 38, 42],
    title: 'Browser',
    icon: 'arrow-right',
    iconRotate: true,
  }),
  new Application({
    types: [34],
    title: 'Samba',
    icon: 'folder',
    defaultLaunchTemplate: 'smb://[host]:[port]',
  }),
]

const defaultApp = new Application({
  types: [],
  title: 'URL',
  icon: 'arrow-right',
  iconRotate: true,
})

export function useApplication(type?: number) {
  let app = applications.find(a => a.types.includes(type || 0))
  return app || defaultApp
}

export function useApplicationService(context: Application['context'], service?: IService, connection?: IConnection) {
  let app = applications.find(a => a.types.includes(service?.typeID || 0))
  if (app) {
    app.context = context
    app.service = service
    app.connection = connection
  }
  return app || defaultApp
}

export default useApplication
