import { IP_PRIVATE } from './constants'
import environment from './environment'
import Logger from './Logger'
import Tracker from './Tracker'
import EventBus from './EventBus'
import cli from './cliInterface'
import nm from 'netmask'
import nw from 'network'
import wifi from 'node-wifi'

const { Netmask } = nm

class LAN {
  data: IScanData = {}
  interfaces?: IInterface[]
  privateIP?: ipAddress = 'unknown'

  EVENTS = {
    privateIP: 'privateIP',
  }

  constructor() {
    wifi.init({
      iface: null, // network interface, choose a random wifi interface if set to null
    })
    this.getInterfaces()
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

  async checkForWifiNetwork(ssid: string, callback: (b: boolean) => void) {
    wifi.getCurrentConnections(function (_: any, currentConnections: any) {
      for (let connection of currentConnections) {
        if (connection.ssid === ssid) {
          callback(true)
          return
        }
      }
      callback(false)
      return
    })
  }

  async scan(interfaceName: string) {
    Logger.info('SCAN start', { interfaceName })
    Tracker.event('scan', 'start', `${interfaceName} scan`)
    if (!interfaceName) return

    try {
      const ipMask = this.findNetmask(interfaceName)
      Logger.info('IPMASK:', { ipMask })
      const result = await cli.scan(ipMask)
      this.parse(interfaceName, result)
      Logger.info('SCAN complete', { data: this.data[interfaceName] })
    } catch (error) {
      Logger.warn('SCAN error', { error })
      this.data[interfaceName] = { timestamp: Date.now(), data: [] }
      EventBus.emit(cli.EVENTS.error, error.toString())
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

export default new LAN()
