import React from 'react'
import { TargetPlatform } from './TargetPlatform'
import { QualityDetails } from './QualityDetails'
import { ServiceIndicators } from './ServiceIndicators'
import { INITIATOR_PLATFORMS } from './InitiatorPlatform'
import { DeviceTagEditor } from './DeviceTagEditor'
import { ListItemText, Chip } from '@material-ui/core'
import { ServiceName } from './ServiceName'
import { LicenseChip } from './LicenseChip'
import { replaceHost } from '../shared/nameHelper'
import { lanShared } from '../helpers/lanSharing'
import { DeviceGeo } from './DeviceGeo'
import { Duration } from './Duration'
import { toLookup } from '../helpers/utilHelper'
import { Avatar } from './Avatar'
import { Tags } from './Tags'

export class Attribute {
  id: string = ''
  label: string = ''
  help?: string
  required: boolean = false
  align?: 'left' | 'right' | 'center'
  column: boolean = true
  defaultWidth: number = 150
  type: 'MASTER' | 'SERVICE' | 'DEVICE' | 'CONNECTION' = 'MASTER'
  feature?: string
  value: (options: IDataOptions) => any = () => {}
  width = (columnWidths: ILookup<number>) => columnWidths[this.id] || this.defaultWidth

  constructor(options: {
    id: string
    label: string
    help?: string
    required?: boolean
    align?: Attribute['align']
    column?: boolean
    defaultWidth?: number
    feature?: string
    type?: Attribute['type']
    value?: Attribute['value']
  }) {
    Object.assign(this, options)
  }

  show(feature: ILookup<boolean>) {
    return !this.feature ? true : feature[this.feature]
  }
}

class DeviceAttribute extends Attribute {
  type: Attribute['type'] = 'DEVICE'
}

class ServiceAttribute extends Attribute {
  type: Attribute['type'] = 'SERVICE'
}

class ConnectionAttribute extends Attribute {
  type: Attribute['type'] = 'CONNECTION'
}

const ATTRIBUTES = [
  { label: 'Category A', id: 'categoryA' },
  { label: 'Category B', id: 'categoryB' },
  { label: 'Category C', id: 'categoryC' },
  { label: 'Category D', id: 'categoryD' },
  { label: 'Category E', id: 'categoryE' },
  { label: 'Status A', id: 'statusA' },
  { label: 'Status B', id: 'statusB' },
  { label: 'Status C', id: 'statusC' },
  { label: 'Status D', id: 'statusD' },
  { label: 'Status E', id: 'statusE' },
]

export const attributes: Attribute[] = [
  new Attribute({
    id: 'deviceName',
    label: 'Name',
    value: ({ device, connection }) => (
      <ListItemText
        primary={<ServiceName device={device} connection={connection} />}
        secondary={device?.thisDevice ? 'This system' : undefined}
      />
    ),
    defaultWidth: 400,
    required: true,
  }),
  new Attribute({
    id: 'active',
    label: 'Online',
    defaultWidth: 100,
    value: ({ device }) =>
      device?.state === 'active' ? (
        <Chip label="Online" size="small" color="primary" />
      ) : (
        <Chip label="Offline" size="small" />
      ),
  }),
  new Attribute({
    id: 'tags',
    label: 'Tags',
    defaultWidth: 100,
    value: ({ device }) => <Tags tags={device?.tags || []} small />,
    feature: 'tagging',
  }),
  new Attribute({
    id: 'services',
    label: 'Services',
    value: ({ device, connections }) => <ServiceIndicators device={device} connections={connections} />,
    defaultWidth: 440,
    align: 'right',
  }),
  new DeviceAttribute({
    id: 'tagEditor',
    label: 'Tags',
    value: ({ device }) => <DeviceTagEditor device={device} />,
    column: false,
    feature: 'tagging',
  }),
  new DeviceAttribute({
    id: 'targetPlatform',
    label: 'Platform',
    defaultWidth: 180,
    value: ({ device }) => TargetPlatform({ id: device?.targetPlatform, label: true }),
  }),
  new DeviceAttribute({
    id: 'quality',
    label: 'Connectivity',
    value: ({ device }) => <QualityDetails device={device} />,
    column: false,
  }),
  new DeviceAttribute({
    id: 'permissions',
    label: 'Permissions',
    defaultWidth: 210,
    value: ({ device }) => {
      const lookup: ILookup<string> = {
        CONNECT: 'Connect',
        SCRIPTING: 'Script',
        MANAGE: 'Manage',
      }
      return device?.permissions.map(p => <Chip label={lookup[p]} size="small" variant="outlined" key={p} />)
    },
  }),
  new DeviceAttribute({
    id: 'owner',
    label: 'Owner',
    value: ({ device }) => device?.owner.email,
  }),
  new Attribute({
    id: 'access',
    label: 'Access',
    value: ({ device }) =>
      device?.shared ? (
        <Avatar email={device?.owner.email} size={22} tooltip />
      ) : (
        device?.access.map((u, i) => <Avatar key={i} email={u.email} size={22} tooltip />)
      ),
  }),
  new DeviceAttribute({
    id: 'lastReported',
    label: 'Last reported',
    value: ({ device }) => (device?.state !== 'active' ? <Duration startDate={device?.lastReported} ago /> : undefined),
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
    column: false,
    value: ({ device, session }) => {
      const geo = device?.geo || session?.geo
      return geo && <DeviceGeo geo={geo} />
    },
  }),
  new DeviceAttribute({
    id: 'city',
    label: 'City',
    defaultWidth: 115,
    value: ({ device }) => device?.geo?.city,
  }),
  new DeviceAttribute({
    id: 'state',
    label: 'State',
    defaultWidth: 100,
    value: ({ device }) => device?.geo?.stateName,
  }),
  new DeviceAttribute({
    id: 'country',
    label: 'Country',
    defaultWidth: 130,
    value: ({ device }) => device?.geo?.countryName,
  }),
  new DeviceAttribute({
    id: 'externalAddress',
    label: 'External IP',
    defaultWidth: 180,
    value: ({ device }) => device?.externalAddress,
  }),
  new DeviceAttribute({
    id: 'internalAddress',
    label: 'Internal IP',
    value: ({ device }) => device?.internalAddress,
  }),
  new DeviceAttribute({
    id: 'id',
    label: 'Device ID',
    defaultWidth: 180,
    value: ({ device }) => device?.id,
  }),
  new DeviceAttribute({
    id: 'hardwareID',
    label: 'Hardware ID',
    defaultWidth: 190,
    value: ({ device }) => device?.hardwareID,
  }),
  new DeviceAttribute({
    id: 'version',
    label: 'Daemon version',
    defaultWidth: 80,
    value: ({ device }) => device?.version,
  }),
  new DeviceAttribute({
    id: 'license',
    label: 'License',
    defaultWidth: 100,
    value: ({ device }) => <LicenseChip license={device?.license} />,
  }),
  // @TODO add attributes to the device model on graphql request
  ...ATTRIBUTES.map(
    a =>
      new DeviceAttribute({
        id: a.id,
        label: a.label,
        value: ({ device }) => device?.attributes[a.id],
      })
  ),
  new ServiceAttribute({
    id: 'connectLink',
    label: 'Connect Link',
    value: ({ service }) => `remoteit://connect/${service?.id}`,
  }),
  new ServiceAttribute({
    id: 'serviceName',
    label: 'Service Name',
    value: ({ service }) => service?.name,
  }),
  new ServiceAttribute({
    id: 'servicePort',
    label: 'Service Port',
    value: ({ service }) => service?.port,
  }),
  new ServiceAttribute({
    id: 'serviceHost',
    label: 'Service Host',
    value: ({ service }) => service?.host,
  }),
  new ServiceAttribute({
    id: 'serviceProtocol',
    label: 'Service Protocol',
    value: ({ service }) => service?.protocol,
  }),
  new ServiceAttribute({
    id: 'serviceLastReported',
    label: 'Last Reported',
    defaultWidth: 230,
    value: ({ service }) =>
      service?.state !== 'active' ? <Duration startDate={service?.lastReported} ago /> : undefined,
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
    defaultWidth: 100,
    value: ({ service }) => <LicenseChip license={service?.license} />,
  }),
  new ConnectionAttribute({
    id: 'duration',
    label: 'Duration',
    value: ({ connection, session }) => {
      const start = connection?.startTime ? new Date(connection.startTime) : session?.timestamp
      const end =
        start && connection?.endTime && connection.endTime > start.getTime() ? new Date(connection.endTime) : undefined
      return start && <Duration startDate={start} endDate={end} />
    },
  }),
  new ConnectionAttribute({
    id: 'connection',
    label: 'Connection',
    value: ({ connection, session }) =>
      connection?.reverseProxy
        ? 'Public Reverse Proxy'
        : connection?.public
        ? 'Public Proxy'
        : !connection?.connected && !session
        ? 'Idle'
        : connection?.isP2P || session?.isP2P
        ? 'Peer to peer'
        : 'Proxy',
  }),
  new ConnectionAttribute({
    id: 'local',
    label: 'Local Address',
    value: ({ connection }) => (connection ? `${connection.host}:${connection.port}` : undefined),
  }),
  new ConnectionAttribute({
    id: 'lanShare',
    label: 'LAN Address',
    value: ({ connection }) => {
      if (connection?.ip && lanShared(connection)) return `${replaceHost(connection.ip)}:${connection.port}`
    },
  }),
  new DeviceAttribute({
    id: 'initiatorPlatform',
    label: 'Platform',
    value: ({ session }) => session && INITIATOR_PLATFORMS[session.platform],
    column: false,
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
