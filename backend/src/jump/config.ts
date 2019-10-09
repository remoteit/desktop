import { resolve } from 'path'

type IConfig = { [key: string]: any }

const config: IConfig = {
  SOCKET_PORT: 3001,
  REMOTEIT_EXEC: 'remoteit',
  WEB_PATH: '/../../client/build',
  SETTINGS_PATH: '/../../settings.json',
  SCRIPT_PATH: '/../../bin/',
}

export function getPath(key: string) {
  return __dirname + config[`${key}_PATH`]
}

export default config
