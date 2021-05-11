import React from 'react'
import { TargetPlatform } from '../components/TargetPlatform'
import { QualityDetails } from '../components/QualityDetails'
import { ServiceIndicators } from '../components/ServiceIndicators'
import { ServiceName } from '../components/ServiceName'
import { Formats } from '../components/Formats'
import { toLookup } from '../helpers/utilHelper'

class DeviceDetail {
  name: string = ''
  label: string = ''
  width?: number
  help?: string
  format?: 'duration' | 'percent' | 'round' | 'location' | 'element' | 'chip'
  onValue: (device?: IDevice, connection?: IConnection, connections?: IConnection[]) => any = () => {}
  visible: boolean = false

  constructor(options: IDataDisplay) {
    Object.assign(this, options)
  }

  value(device?: IDevice, connection?: IConnection, connections?: IConnection[]) {
    const value = this.onValue(device, connection, connections)
    return this.format ? Formats[this.format](value) : value
  }
}

const ATTRIBUTES = [
  'categoryA',
  'categoryB',
  'categoryC',
  'categoryD',
  'categoryE',
  'statusA',
  'statusB',
  'statusC',
  'statusD',
  'statusE',
]

export const deviceDetails: DeviceDetail[] = [
  new DeviceDetail({
    name: 'name',
    label: 'Device Name',
    onValue: (device, connection) => <ServiceName device={device} connection={connection} />,
    width: 250,
    visible: true,
  }),
  new DeviceDetail({
    name: 'services',
    label: 'Services',
    onValue: (device, _, connections) => <ServiceIndicators device={device} connections={connections} />,
    width: 300,
    visible: true,
  }),
  new DeviceDetail({
    name: 'targetPlatform',
    label: 'Platform',
    onValue: device => TargetPlatform({ id: device?.targetPlatform, label: true }),
    format: 'element',
    width: 150,
  }),
  new DeviceDetail({
    name: 'quality',
    label: 'Connectivity',
    format: 'element',
    onValue: device => <QualityDetails device={device} />,
    width: 150,
  }),
  new DeviceDetail({ name: 'owner', label: 'Owner', onValue: device => device?.owner.email, width: 220 }),
  new DeviceDetail({
    name: 'lastReported',
    label: 'Last reported',
    onValue: device => ({ start: device?.lastReported, ago: true }),
    format: 'duration',
    width: 220,
  }),
  new DeviceDetail({ name: 'isp', label: 'ISP', onValue: device => device?.geo?.isp, width: 120 }),
  new DeviceDetail({
    name: 'connectionType',
    label: 'Connection type',
    onValue: device => device?.geo?.connectionType,
    width: 100,
  }),
  new DeviceDetail({
    name: 'location',
    label: 'Location',
    onValue: device => device?.geo,
    format: 'location',
    width: 120,
  }),
  new DeviceDetail({
    name: 'externalAddress',
    label: 'External IP address',
    onValue: device => device?.externalAddress,
    width: 180,
  }),
  new DeviceDetail({
    name: 'internalAddress',
    label: 'Internal IP address',
    onValue: device => device?.internalAddress,
    width: 180,
  }),
  new DeviceDetail({ name: 'id', label: 'Device ID', onValue: device => device?.id, width: 180 }),
  new DeviceDetail({ name: 'hardwareID', label: 'Hardware ID', onValue: device => device?.hardwareID, width: 200 }),
  new DeviceDetail({ name: 'version', label: 'Daemon version', onValue: device => device?.version, width: 60 }),
  ...ATTRIBUTES.map(
    name => new DeviceDetail({ name, label: name, onValue: device => device?.attributes[name], width: 150 })
  ),
]

const deviceDetailLookup = toLookup<DeviceDetail>(deviceDetails, 'name')

export function useDeviceDetails(name: string): DeviceDetail {
  return deviceDetailLookup[name]
}
