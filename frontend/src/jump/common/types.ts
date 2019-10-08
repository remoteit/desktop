export interface ITarget {
  hostname: string //     proxy_dest_ip      service ip to forward
  hardwareID?: string
  uid: string //          UID
  name: string
  secret?: string //      password
  port: number //         proxy_dest_port    service port
  type: number //         application_type   service type
}

export interface IDevice extends ITarget {}

export type IScan = [string, [number, string][]] // address, port, type string

export type IScanData = { [networkName: string]: IScan[] }

export type IInterface = { [key: string]: string }

export type IInterfaceType =
  | 'Wired'
  | 'Wireless'
  | 'FireWire'
  | 'Thunderbolt'
  | 'Bluetooth'
  | 'Other'
