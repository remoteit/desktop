import React from 'react'
import { TargetPlatform } from '../components/TargetPlatform'
import { QualityDetails } from '../components/QualityDetails'
import { ServiceIndicators } from '../components/ServiceIndicators'
import { ListItemText } from '@material-ui/core'
import { licenseChip } from '../models/licensing'
import { ServiceName } from '../components/ServiceName'
import { LicenseChip } from '../components/LicenseChip'
import { DeviceGeo } from '../components/DeviceGeo'
import { Duration } from '../components/Duration'
import { toLookup } from './utilHelper'

// type AttributeParams = Omit<Attribute, 'value'>

export class Attribute {
  id: string = ''
  label: string = ''
  width?: string = '1fr'
  help?: string
  required?: boolean = false
  column?: boolean = true
  type?: 'MASTER' | 'SERVICE' | 'DEVICE' = 'MASTER'
  value: (options: IDataOptions) => any = () => {}

  constructor(options: Attribute) {
    Object.assign(this, options)
  }
}

class DeviceAttribute extends Attribute {
  type: Attribute['type'] = 'DEVICE'
}

class ServiceAttribute extends Attribute {
  type: Attribute['type'] = 'SERVICE'
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

export const attributes: Attribute[] = [
  new Attribute({
    id: 'deviceName',
    label: 'Device Name',
    value: ({ device, connection }) => (
      <ListItemText primary={<ServiceName device={device} connection={connection} />} />
    ),
    required: true,
  }),
  new Attribute({
    id: 'services',
    label: 'Services',
    value: ({ device, connections }) => <ServiceIndicators device={device} connections={connections} />,
    width: '2fr',
  }),
  new DeviceAttribute({
    id: 'targetPlatform',
    label: 'Platform',
    value: ({ device }) => TargetPlatform({ id: device?.targetPlatform, label: true }),
  }),
  new DeviceAttribute({
    id: 'quality',
    label: 'Connectivity',
    value: ({ device }) => <QualityDetails device={device} />,
    column: false,
  }),
  new DeviceAttribute({
    id: 'owner',
    label: 'Owner',
    value: ({ device }) => device?.owner.email,
  }),
  new DeviceAttribute({
    id: 'lastReported',
    label: 'Last reported',
    value: ({ device }) => <Duration startDate={device?.lastReported} ago />,
  }),
  new DeviceAttribute({ id: 'isp', label: 'ISP', value: ({ device }) => device?.geo?.isp }),
  new DeviceAttribute({
    id: 'connectionType',
    label: 'Connection type',
    value: ({ device }) => device?.geo?.connectionType,
  }),
  new DeviceAttribute({
    id: 'location',
    label: 'Location',
    value: ({ device }) => <DeviceGeo geo={device?.geo} />,
  }),
  new DeviceAttribute({
    id: 'externalAddress',
    label: 'External IP address',
    value: ({ device }) => device?.externalAddress,
  }),
  new DeviceAttribute({
    id: 'internalAddress',
    label: 'Internal IP address',
    value: ({ device }) => device?.internalAddress,
  }),
  new DeviceAttribute({ id: 'id', label: 'Device ID', value: ({ device }) => device?.id }),
  new DeviceAttribute({
    id: 'hardwareID',
    label: 'Hardware ID',
    value: ({ device }) => device?.hardwareID,
  }),
  new DeviceAttribute({ id: 'version', label: 'Daemon version', value: ({ device }) => device?.version }),
  // @TODO add attributes to the device model on graphql request
  ...ATTRIBUTES.map(
    id =>
      new DeviceAttribute({
        id,
        label: id,
        value: ({ device }) => device?.attributes[id],
      })
  ),
  new ServiceAttribute({
    id: 'serviceName',
    label: 'Service Name',
    value: ({ service }) => service?.name,
  }),
  new ServiceAttribute({
    id: 'servicePort',
    label: 'Remote Port',
    value: ({ service }) => service?.port,
  }),
  new ServiceAttribute({
    id: 'serviceProtocol',
    label: 'Remote Protocol',
    value: ({ service }) => service?.protocol,
  }),
  new ServiceAttribute({
    id: 'serviceLastReported',
    label: 'Last Reported',
    value: ({ service }) => <Duration startDate={service?.lastReported} ago />,
  }),
  new ServiceAttribute({
    id: 'serviceType',
    label: 'Service Type',
    value: ({ service }) => service?.type,
  }),
  new ServiceAttribute({
    id: 'serviceId',
    label: 'Service ID',
    value: ({ service }) => service?.id,
  }),
  new ServiceAttribute({
    id: 'license',
    label: 'License',
    value: ({ service }) => <LicenseChip chip={licenseChip[service?.license || 0]} />,
  }),
]

const attributeLookup = toLookup<Attribute>(attributes, 'id')

export const masterAttributes = attributes.filter(a => a.type === 'MASTER')
export const deviceAttributes = attributes.filter(a => a.type === 'DEVICE')
export const serviceAttributes = attributes.filter(a => a.type === 'SERVICE')

export function getAttribute(id: string): Attribute {
  return attributeLookup[id]
}

export function getAttributes(ids: string[]): Attribute[] {
  return ids.map(id => attributeLookup[id])
}
