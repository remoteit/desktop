import React from 'react'
import { TargetPlatform } from '../components/TargetPlatform'
import { QualityDetails } from '../components/QualityDetails'
import { ServiceIndicators } from '../components/ServiceIndicators'
import { INITIATOR_PLATFORMS } from '../components/InitiatorPlatform'
import { ListItemText, Chip } from '@material-ui/core'
import { ServiceName } from '../components/ServiceName'
import { LicenseChip } from '../components/LicenseChip'
import { replaceHost } from '../shared/nameHelper'
import { lanShared } from '../helpers/lanSharing'
import { DeviceGeo } from '../components/DeviceGeo'
import { TagEditor } from '../components/TagEditor'
import { Duration } from '../components/Duration'
import { toLookup } from './utilHelper'
import { TestUI } from '../components/TestUI'
import { Tags } from '../components/Tags'

export class Attribute {
  id: string = ''
  label: string = ''
  width?: string = '130px'
  help?: string
  required?: boolean = false
  column?: boolean = true
  type?: 'MASTER' | 'SERVICE' | 'DEVICE' | 'CONNECTION' = 'MASTER'
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

class ConnectionAttribute extends Attribute {
  type: Attribute['type'] = 'CONNECTION'
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
      <ListItemText
        primary={<ServiceName device={device} connection={connection} />}
        secondary={device?.thisDevice ? 'This system' : undefined}
      />
    ),
    width: '200px',
    required: true,
  }),
  new Attribute({
    id: 'tags',
    label: 'Tags',
    value: ({ device }) => (TestUI({}) ? <Tags ids={device?.tags || []} small /> : undefined),
    width: '80px',
  }),
  new Attribute({
    id: 'services',
    label: 'Services',
    value: ({ device, connections }) => <ServiceIndicators device={device} connections={connections} />,
    width: '350px',
  }),
  new DeviceAttribute({
    id: 'tagEditor',
    label: 'tags',
    value: ({ device }) => (TestUI({}) ? <TagEditor device={device} /> : undefined),
    column: false,
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
    id: 'permissions',
    label: 'Permissions',
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
    value: ({ device, session }) => {
      const geo = device?.geo || session?.geo
      return geo && <DeviceGeo geo={geo} />
    },
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
  new DeviceAttribute({
    id: 'version',
    label: 'Daemon version',
    value: ({ device }) => device?.version,
    width: '30px',
  }),
  new DeviceAttribute({
    id: 'license',
    label: 'License',
    value: ({ device }) => <LicenseChip license={device?.license} />,
  }),
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
