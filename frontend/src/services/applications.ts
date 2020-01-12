import { hostName } from '../helpers/nameHelper'
// import { isWindows, isMac } from '../services/Platform'

interface IApplication {
  types: number[]
  title: string
  icon: string
  prompt?: boolean
  iconRotate?: boolean
  launchDisabled?: boolean
  launch: (connection: IConnection) => string
  copy: (connection: IConnection) => string
}

export const applications: IApplication[] = [
  {
    types: [4],
    title: 'VNC',
    icon: 'desktop',
    launch: (c: IConnection) => `vnc://${hostName(c)}`,
    copy: (c: IConnection) => `${hostName(c)}`,
  },
  {
    types: [28],
    title: 'SSH',
    icon: 'terminal',
    prompt: true,
    launch: (c: IConnection) => `ssh://${c.username || '[username]'}@${hostName(c)}`,
    copy: (c: IConnection) =>
      `ssh -l ${c.username || 'root'} ${c.host} -p ${
        c.port
      } -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile /dev/null"`,
  },
  {
    types: [8, 10, 33],
    title: 'Secure Browser',
    icon: 'arrow-right',
    iconRotate: true,
    launch: (c: IConnection) => `https://${hostName(c)}`,
    copy: (c: IConnection) => `https://${hostName(c)}`,
  },
  {
    types: [7, 30, 38],
    title: 'Browser',
    icon: 'arrow-right',
    iconRotate: true,
    launch: (c: IConnection) => `http://${hostName(c)}`,
    copy: (c: IConnection) => `http://${hostName(c)}`,
  },
]

const defaultApp: IApplication = {
  types: [],
  title: 'URL',
  icon: 'arrow-right',
  iconRotate: true,
  launch: (c: IConnection) => `http://${hostName(c)}`,
  copy: (c: IConnection) => `${hostName(c)}`,
}

export function useApplication(type?: number) {
  let app = applications.find(a => a.types.includes(type || 0))
  return app || defaultApp
}
