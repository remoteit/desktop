import environment from './environment'
import cli from './cliInterface'
import lan from './LAN'
import os from 'os'

export default async function systemInfo() {
  await lan.getInterfaces()

  let info: ILookup = {
    arch: os.arch(),
    platform: environment.platform,
    privateIP: lan.privateIP,
    name: cli.data.device.name,
    interfaces: lan.interfaces,
  }

  return info
}
