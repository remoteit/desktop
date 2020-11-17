/* 
  This is a shared file between backend and frontend
  It will be copied from the frontend to the backend on build
  
  ONLY EDIT THE SOURCE FILE IN frontend
*/

import { replaceHost } from './nameHelper'

class Application {
  types: number[] = []
  title: string = 'URL'
  icon: string = 'arrow-right'
  launchTemplate: string = 'http://[host]:[port]'
  commandTemplate?: string = '[host]:[port]'
  prompt: boolean = false
  iconRotate: boolean = false
  tokens: string = '[host] [port] [id]'

  constructor(options: { [key in keyof Application]?: any }) {
    Object.assign(this, options)
  }

  launch(connection: IConnection) {
    return this.parse(connection.launchTemplate || this.launchTemplate, connection)
  }

  copy(connection: IConnection) {
    const template = connection.commandTemplate || this.commandTemplate
    return template ? this.parse(template, connection) : this.launch(connection)
  }

  parse(url: string = '', connection: ILookup<any>) {
    for (const key in connection) if (connection[key]) url = url.replace(`[${key}]`, encodeURI(connection[key]))
    url = replaceHost(url)
    return url
  }

  missingTokens(url: string, connection: IConnection) {
    const result = this.parse(url, connection)
    const matches: string[] = result.match(/\[[^\]]*\]/g) || []
    return matches.map(m => m.slice(1, -1))
  }
}

const applications: Application[] = [
  new Application({
    types: [4],
    title: 'VNC',
    icon: 'desktop',
    launchTemplate: 'vnc://[host]:[port]',
  }),
  new Application({
    types: [28],
    title: 'SSH',
    icon: 'terminal',
    prompt: true,
    tokens: '[host] [port] [id] [username]',
    launchTemplate: 'ssh://[username]@[host]:[port]',
    commandTemplate:
      'ssh -l [username] [host] -p [port] -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile /dev/null"',
  }),
  new Application({
    types: [8, 10, 33],
    title: 'Secure Browser',
    icon: 'arrow-right',
    iconRotate: true,
    launchTemplate: 'https://[host]:[port]',
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
    launchTemplate: 'smb://[host]:[port]',
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

export default useApplication
