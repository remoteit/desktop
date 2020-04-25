import { IP_PRIVATE, PLATFORM_CODES, REMOTEIT_PI_WIFI } from './constants'
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
  oobAvailable?: boolean
  oobActive?: boolean
  nextCheck?: number

  private static readonly OOB_CHECK_INTERVAL = 1000 //30 * 60 * 1000 //30 Min in ms

  EVENTS = {
    privateIP: 'privateIP',
    lan: 'lan',
    oob: 'oob',
  }

  constructor() {
    wifi.init({
      iface: null, // network interface, choose a random wifi interface if set to null
    })
    this.oobAvailable = environment.manufacturerDetails.product.platform === PLATFORM_CODES.REMOTEIT_PI
    this.oobActive = false
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

  //Called from electron on heartbeat
  async check() {
    if (this.oobAvailable && (!this.nextCheck || this.nextCheck < Date.now())) {
      let prevOobActive = this.oobActive
      await this.checkOob()
      if (prevOobActive !== this.oobActive) {
        EventBus.emit(this.EVENTS.oob, { oobAvailable: this.oobAvailable, oobActive: this.oobActive })
      }
      this.nextCheck = Date.now() + LAN.OOB_CHECK_INTERVAL
    }
  }

  async checkOob() {
    return new Promise<void>((success, failure) => {
      const lan = this
      if (!lan.oobAvailable) {
        lan.oobAvailable = false
        success()
        return
      }
      wifi.getCurrentConnections(function (error: any, currentConnections: any) {
        if (error) failure(error)
        for (let connection of currentConnections) {
          if (connection.ssid === REMOTEIT_PI_WIFI) {
            lan.oobActive = true
            success()
            return
          }
        }
        lan.oobActive = false
        success()
        return
      })
    })
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
