import Logger from '../Logger'
import { execFile } from 'child_process'
import { getPath } from './config'
import { IScan, IScanData, IInterface } from './common-copy/types'
import nm from 'netmask'
import nw from 'network'

const { Netmask } = nm

class LAN {
  data: IScanData = {}
  interfaces?: IInterface[]

  constructor() {
    this.getInterfaces()
  }

  async getInterfaces() {
    return new Promise<IInterface[]>((success, failure) => {
      nw.get_interfaces_list((listErr: Error, list: any) => {
        if (listErr) failure(listErr)
        Logger.info('INTERFACE list', list)
        nw.get_active_interface((activeErr: Error, active: any) => {
          if (activeErr) Logger.warn('INTERFACE active', activeErr)
          active = active || {}
          Logger.warn('INTERFACE active', active)
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
          Logger.info('GET INTERFACES:', this.interfaces)
          success()
        })
      })
    })
  }

  async scan(interfaceName: string) {
    Logger.info('SCAN start', interfaceName)
    if (!interfaceName) return

    try {
      const ipMask = this.findNetmask(interfaceName)
      Logger.info('IPMASK:', ipMask)
      const result = await this.exec(ipMask)
      Logger.info('SCAN raw:', result)
      this.parse(interfaceName, result)
      Logger.info('SCAN complete', this.data[interfaceName])
    } catch (error) {
      Logger.warn('SCAN error', error)
      this.data[interfaceName] = []
    }
  }

  findNetmask(interfaceName: string) {
    const network =
      !!this.interfaces && this.interfaces.find((i: IInterface) => i.name === interfaceName)
    Logger.info('NETWORK', network)
    const netmask = network && new Netmask(network.ip + '/' + network.netmask)
    Logger.info('Find Mac netmask', interfaceName, netmask.toString())
    return netmask.toString()
  }

  exec(ipMask: string) {
    Logger.info('START scan:', getPath('SCRIPT') + `scan.sh ${ipMask}`)
    return new Promise<string>((success, failure) => {
      execFile(getPath('SCRIPT') + 'scan.sh', [ipMask], (error, result) => {
        if (error) {
          Logger.info('*** ERROR *** EXEC scan', error.toString())
          failure()
        }
        success(result.toString())
      })
    })
  }

  parse(interfaceName: string, stdout: string) {
    const blocks = stdout.split('Nmap scan report for ')
    const data: IScan[] = blocks.reduce((result: IScan[], block) => {
      const lines = block.split('\n')
      if (!lines[0]) return result

      const ip = lines[0].trim()
      let ports: [number, string][] = []

      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].split(/\s+/)
        if (line[1] === 'open') {
          // ip, port, type
          ports.push([+line[0].split('/')[0], line[2]])
        }
      }

      if (ports.length) result.push([ip, ports])
      return result
    }, [])
    this.data[interfaceName] = data
  }
}

export default new LAN()
