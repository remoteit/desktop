import environment from './environment'
import cli from './cliInterface'
import lan from './LAN'
import os from 'os'

export default async function systemInfo() {
  await lan.getInterfaces()

  return {
    os: environment.simpleOS,
    arch: os.arch(),
    platform: os.platform(),
    privateIP: lan.privateIP,
    name: cli.data.device.name,
    interfaces: lan.interfaces,
  }
}
