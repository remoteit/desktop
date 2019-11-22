// import { ConfigFile } from './ConfigFile'
import Environment from './Environment'
import JSONFile from './JSONFile'
import defaults from './helpers/defaults'
import Logger from './Logger'
import path from 'path'
// import {promisify} from 'util'
import { exec } from 'child_process'
import { removeDeviceName } from './helpers/nameHelper'
import { BIN_PATH } from './constants'

// const execPromise = promisify(exec)

export default class CLI {
  data: { user?: UserCredentials; device: IDevice; targets: ITarget[] } = {
    user: undefined,
    device: defaults,
    targets: [defaults],
  }

  file: JSONFile<ConfigFile>

  constructor() {
    console.log('INIT CONFIG FILE', path.join(Environment.remoteitDirectory, 'config.json'))
    this.file = new JSONFile<ConfigFile>(path.join(Environment.remoteitDirectory, 'config.json'))
    this.read()
  }

  read() {
    this.readUser()
    this.readDevice()
    this.readTargets()
    Logger.info('read config', { config: this.data })
  }

  write(key: string, value: any) {
    let config = this.readFile()
    key = key === 'targets' ? 'services' : key
    key = key === 'user' ? 'auth' : key
    config[key] = value
    this.file.write()
  }

  readUser() {
    const config = this.readFile()
    this.data.user = config.auth
  }

  readDevice() {
    const config = this.readFile()
    const device = config.device || defaults
    this.data.device = {
      ...device,
      hostname: device.hostname || '',
      name: device.name || '',
    }
  }

  readTargets() {
    const deviceName = this.data.device && this.data.device.name
    const config = this.readFile()
    const targets = config.services || []
    this.data.targets = targets.map(service => ({
      ...service,
      hostname: service.hostname || '',
      name: removeDeviceName(deviceName, service.name) || '',
    }))
  }

  private readFile() {
    return this.file.read() || {}
  }

  async addTarget(t: ITarget) {
    await CLI.exec(`add "${t.name}" ${t.port} --type ${t.type} --hostname ${t.hostname || '127.0.0.1'}`)
  }

  async removeTarget(t: ITarget) {
    await CLI.exec(`remove ${t.uid}`)
  }

  async register(device: IDevice) {
    await CLI.exec(`setup "${device.name}"`)
  }

  async delete(d: IDevice) {
    await CLI.exec(`teardown ${d.uid} --yes`)
  }

  async install() {
    await CLI.exec('tools install')
  }

  async signOut() {
    await CLI.exec('signout')
  }

  async scan(ipMask: string) {
    const result = await CLI.exec(`scan -j -m ${ipMask}`)
    console.log('SCAN RESULT', result)
    console.log('SCAN TYPE', typeof result)
    return [
      {
        host: '192.168.0.1',
        name: 'http',
        port: 80,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.1',
        name: 'ssh',
        port: 22,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.1',
        name: 'https',
        port: 443,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.1',
        name: 'domain',
        port: 53,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.100',
        name: 'https-alt',
        port: 8443,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.100',
        name: 'http',
        port: 8008,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.100',
        name: 'ajp13',
        port: 8009,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.111',
        name: 'https-alt',
        port: 8443,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.111',
        name: 'http',
        port: 8008,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.111',
        name: 'ajp13',
        port: 8009,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.113',
        name: 'ssh',
        port: 22,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.113',
        name: 'vnc',
        port: 5900,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.152',
        name: 'ppp',
        port: 3000,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.154',
        name: 'https-alt',
        port: 8443,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.154',
        name: 'http',
        port: 8008,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.154',
        name: 'ajp13',
        port: 8009,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.155',
        name: 'cisco-sccp',
        port: 2000,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.178',
        name: 'http',
        port: 8008,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.178',
        name: 'https-alt',
        port: 8443,
        protocol: 'tcp',
      },
      {
        host: '192.168.0.178',
        name: 'ajp13',
        port: 8009,
        protocol: 'tcp',
      },
    ]
  }

  static exec(command: string) {
    return new Promise<string>((success, failure) => {
      Logger.info('EXEC', { exec: `${BIN_PATH}remoteit.darwin.amd64 ${command}` })
      exec(`${BIN_PATH}remoteit.darwin.amd64 ${command}`, (error, stdout, stderr) => {
        if (error) {
          Logger.error(`*** ERROR *** EXEC ${command}: `, { error })
          failure()
        }
        Logger.info('EXEC SUCCESS', { stdout })
        success(stdout)
      })
    })
  }
}
