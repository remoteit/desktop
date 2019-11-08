import { ConfigFile } from '@remote.it/core'
import { execSync } from 'child_process'
import { removeDeviceName } from './helpers/nameHelper'
import { REMOTEIT_EXEC } from './constants'
import defaults from './helpers/defaults'

export default class File {
  data: { device: IDevice; targets: ITarget[] } = {
    device: defaults,
    targets: [defaults],
  }

  file: ConfigFile

  constructor() {
    console.log('INIT CONFIG FILE')
    this.file = new ConfigFile()
  }

  read() {
    this.readDevice()
    this.readTargets()
  }

  readDevice() {
    const target = this.file.target || defaults
    this.data.device = {
      ...target,
      hostname: target.hostname || '',
      name: target.name || '',
    }
  }

  readTargets() {
    const deviceName = this.data.device && this.data.device.name
    this.data.targets = this.file.services.map(service => ({
      ...service,
      hostname: service.hostname || '',
      name: removeDeviceName(deviceName, service.name) || '',
    }))
  }

  write(key: string, value: any) {
    if (key === 'targets') this.file.services = value
    if (key === 'user') this.file.user = value
  }

  addTarget(t: ITarget) {
    this.exec(`service create ${t.port} ${t.type} "${t.name}" ${t.hostname || '127.0.0.1'}`)
  }

  removeTarget(t: ITarget) {
    this.exec(`service remove ${t.uid}`)
  }

  register(device: IDevice) {
    this.exec(`target create "${device.name}"`)
  }

  delete() {
    this.exec('target remove --yes')
  }

  exec(command: string) {
    try {
      console.log('EXEC: ' + REMOTEIT_EXEC + ' ' + command)
      const result = execSync(REMOTEIT_EXEC + ' ' + command)
      console.log(result.toString())
    } catch (error) {
      console.log(`*** ERROR *** EXEC ${command}: `, error.toString())
    }
  }
}
