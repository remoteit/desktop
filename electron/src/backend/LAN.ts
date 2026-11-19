import { IP_PRIVATE } from '@common/constants'
import environment from './environment'
import Logger from './Logger'
import EventBus from './EventBus'
import cli from './cliInterface'
import windowsInterfaces from './windowsInterfaces'
import { promisify } from 'util'
import nm from 'netmask'
import nw from 'network'

const { Netmask } = nm

class LAN {
  data: IScanData = {}
  interfaces?: IInterface[]
  privateIP?: ipAddress = 'unknown'
  nextCheck?: number

  private static readonly CHECK_INTERVAL = 30 * 60 * 1000 // 30 Min in ms

  EVENTS = {
    privateIP: 'privateIP',
    interfaces: 'interfaces',
  }

  constructor() {
    this.getInterfaces()
  }

  async check() {
    if (environment.oobAvailable && (!this.nextCheck || this.nextCheck < Date.now())) {
      this.getInterfaces()
      EventBus.emit(this.EVENTS.interfaces, this.interfaces)
      this.nextCheck = Date.now() + LAN.CHECK_INTERVAL
    }
  }

  setPrivateIP() {
    if (this.interfaces && this.interfaces.length) {
      this.privateIP = this.interfaces[0].ip
      this.interfaces.map(i => {
        if (i.active) this.privateIP = i.ip
      })
    }
    Logger.info('PRIVATE IP', { ip: this.privateIP })
    environment.privateIP = this.privateIP || ''
    EventBus.emit(environment.EVENTS.send, environment.frontend)
  }

  async getInterfaces() {
    try {
      this.interfaces = environment.isWindows ? await windowsInterfaces() : await networkInterfaces()
    } catch (error) {
      Logger.warn('GET INTERFACES error', { error })
      return
    }
    Logger.info('GET INTERFACES:', { interfaces: this.interfaces })
    this.setPrivateIP()
  }

  async scan(interfaceName: string) {
    if (!interfaceName) {
      Logger.warn('SCANNING SKIPPED:', { reason: 'no interface name' })
      return
    }

    try {
      const ipMask = this.findNetmask(interfaceName)
      Logger.info('IPMASK:', { ipMask })
      const result = await cli.scan(ipMask)
      this.parse(interfaceName, result)
      Logger.info('SCAN complete', { data: this.data[interfaceName] })
    } catch (error) {
      Logger.warn('SCAN error', { error })
      this.data[interfaceName] = { timestamp: Date.now(), data: [] }
      EventBus.emit(cli.EVENTS.error, 'Scanning failed. Please check that you have a network connection.')
    }
  }

  findNetmask(interfaceName: string) {
    if (interfaceName === 'localhost') return IP_PRIVATE
    const network = !!this.interfaces && this.interfaces.find((i: IInterface) => i.name === interfaceName)
    if (!network) return ''
    const netmask = new Netmask(network.ip + '/' + network.netmask)
    return netmask.toString()
  }

  parse(interfaceName: string, json: IScanDataRaw[]) {
    let data: IScan[] = []
    let ports: [number, string][] = []
    let item: IScanDataRaw
    let next: IScanDataRaw

    for (let i = 0; i < json.length; i++) {
      item = json[i]
      next = json[i + 1] || { host: '', name: '', port: 0, protocol: '' }

      ports.push([item.port, item.name])

      if (item.host !== next.host) {
        data.push([item.host, ports])
        ports = []
      }
    }

    this.data[interfaceName] = { timestamp: Date.now(), data }
  }
}

async function networkInterfaces(): Promise<IInterface[]> {
  const list: any[] = await promisify(nw.get_interfaces_list)()
  let active: any
  try {
    active = await promisify(nw.get_active_interface)()
    Logger.info('INTERFACE active', { active })
  } catch (error) {
    Logger.warn('INTERFACE active error', { error })
  }
  return list
    .filter(item => item.ip_address)
    .map(item => ({
      active: item.name === active?.name,
      gateway: item.gateway_ip,
      ip: item.ip_address,
      mac: item.mac_address,
      netmask: item.netmask,
      name: item.name,
      type: item.type,
    }))
}

export default new LAN()
