import Logger from './Logger'
import { execFile } from 'child_process'
import { SCRIPT_PATH } from './constants'
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
        nw.get_active_interface((activeErr: Error, active: any) => {
          if (activeErr) Logger.warn('INTERFACE active', activeErr)
          else Logger.info('INTERFACE active', active)
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
      this.parse(interfaceName, result)
      Logger.info('SCAN complete', this.data[interfaceName])
    } catch (error) {
      Logger.error('SCAN error', error)
      this.data[interfaceName] = { timestamp: Date.now(), data: [] }
    }
  }

  findNetmask(interfaceName: string) {
    const network = !!this.interfaces && this.interfaces.find((i: IInterface) => i.name === interfaceName)
    if (!network) return ''
    const netmask = new Netmask(network.ip + '/' + network.netmask)
    return netmask.toString()
  }

  exec(ipMask: string) {
    return new Promise<string>((success, failure) => {
      execFile(SCRIPT_PATH + 'scan.sh', [ipMask], (error, result) => {
        if (error) {
          Logger.error('*** ERROR *** EXEC scan', error.toString())
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
    this.data[interfaceName] = { timestamp: Date.now(), data }
  }
}

export default new LAN()
