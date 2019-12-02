import Logger from './Logger'
import CLIInterface from './CLIInterface'
import EventBus from './EventBus'
import nm from 'netmask'
import nw from 'network'

const { Netmask } = nm

export default class LAN {
  data: IScanData = {}
  interfaces?: IInterface[]
  privateIP?: ipAddress = 'unknown'
  private cli: CLIInterface

  static EVENTS = {
    privateIP: 'privateIP',
  }

  constructor(cli: CLIInterface) {
    this.getInterfaces()
    this.cli = cli
  }

  setPrivateIP() {
    if (this.interfaces && this.interfaces.length) {
      this.privateIP = this.interfaces[0].ip
      this.interfaces.map(i => {
        if (i.active) this.privateIP = i.ip
      })
    }
    Logger.info('PRIVATE IP', { ip: this.privateIP })
    EventBus.emit(LAN.EVENTS.privateIP, this.privateIP)
  }

  async getInterfaces() {
    return new Promise<IInterface[]>((success, failure) => {
      nw.get_interfaces_list((listErr: Error, list: any) => {
        if (listErr) failure(listErr)
        nw.get_active_interface((activeErr: Error, active: any) => {
          if (activeErr) Logger.warn('INTERFACE active error', { error: activeErr })
          else Logger.info('INTERFACE active', { active })
          active = active || {}
          this.interfaces = list.reduce((result: IInterface[], item: any) => {
            if (item.ip_address) {
              result.push({
                active: item.name === active.name,
                gateway: item.gateway_ip,
                ip: item.ip_address,
                mac: item.mac_address,
                netmask: item.netmask,
                name: item.name,
                type: item.type,
              })
            }
            return result
          }, [])
          Logger.info('GET INTERFACES:', { interfaces: this.interfaces })
          this.setPrivateIP()
          success()
        })
      })
    })
  }

  async scan(interfaceName: string) {
    Logger.info('SCAN start', { interfaceName })
    if (!interfaceName) return

    try {
      const ipMask = this.findNetmask(interfaceName)
      Logger.info('IPMASK:', { ipMask })
      const result = await this.cli.scan(ipMask)
      this.parse(interfaceName, result)
      Logger.info('SCAN complete', { data: this.data[interfaceName] })
    } catch (error) {
      Logger.warn('SCAN error', { error })
      this.data[interfaceName] = { timestamp: Date.now(), data: [] }
    }
  }

  findNetmask(interfaceName: string) {
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
      next = json[i + 1] || {}

      ports.push([item.port, item.name])

      if (item.host !== next.host) {
        data.push([item.host, ports])
        ports = []
      }
    }

    this.data[interfaceName] = { timestamp: Date.now(), data }
  }
}
