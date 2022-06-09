import React from 'react'
import { TargetPlatform } from './TargetPlatform'
import { QualityDetails } from './QualityDetails'
import { ServiceIndicators } from './ServiceIndicators'
import { INITIATOR_PLATFORMS } from './InitiatorPlatform'
import { DeviceTagEditor } from './DeviceTagEditor'
import { ListItemText, Chip, Typography } from '@material-ui/core'
import { RestoreButton } from '../buttons/RestoreButton'
import { ServiceName } from './ServiceName'
import { LicenseChip } from './LicenseChip'
import { replaceHost } from '../shared/nameHelper'
import { AvatarList } from './AvatarList'
import { PERMISSION } from '../models/organization'
import { DeviceRole } from './DeviceRole'
import { ColorChip } from './ColorChip'
import { lanShared } from '../helpers/lanSharing'
import { Timestamp } from './Timestamp'
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
  type: 'MASTER' | 'SERVICE' | 'DEVICE' | 'CONNECTION' | 'RESTORE' = 'MASTER'
  feature?: string
  multiline?: boolean
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
    multiline?: boolean
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

class RestoreAttribute extends Attribute {
  type: Attribute['type'] = 'RESTORE'
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
  new RestoreAttribute({
    id: 'restore',
    label: 'Restore',
    value: ({ device }) => device && <RestoreButton device={device} />,
    required: true,
  }),
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
    id: 'status',
    label: 'Status',
    defaultWidth: 100,
    value: ({ device, connection }) =>
      connection?.connected ? (
        <ColorChip label="Connected" size="small" typeColor="alwaysWhite" backgroundColor="primary" />
      ) : connection?.enabled ? (
        <ColorChip label="Ready" size="small" typeColor="primary" />
      ) : device?.state === 'active' ? (
        <ColorChip label="Online" size="small" typeColor="secondary" />
      ) : (
        <ColorChip label="Offline" size="small" typeColor="gray" />
      ),
  }),
  new Attribute({
    id: 'tags',
    label: 'Tags',
    defaultWidth: 120,
    value: ({ device }) => <Tags tags={device?.tags || []} small />,
    feature: 'tagging',
  }),
  new Attribute({
    id: 'qualitySmall',
    label: 'Quality',
    defaultWidth: 120,
    value: ({ device }) => <QualityDetails device={device} small />,
  }),
  new Attribute({
    id: 'services',
    label: 'Services',
    value: ({ device, connections }) => <ServiceIndicators device={device} connections={connections} />,
    defaultWidth: 350,
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
      return device?.permissions.map(p => <Chip label={PERMISSION[p].name} size="small" variant="outlined" key={p} />)
    },
  }),
  new DeviceAttribute({
    id: 'role',
    label: 'Role',
    defaultWidth: 210,
    value: ({ device }) => <DeviceRole device={device} />,
  }),
  new DeviceAttribute({
    id: 'owner',
    label: 'Owner',
    value: ({ device }) =>
      device && (
        <Avatar email={device.owner.email} size={22} inline>
          {device.owner.email}
        </Avatar>
      ),
  }),
  new Attribute({
    id: 'access',
    label: 'Users',
    defaultWidth: 200,
    value: ({ device }) =>
      device?.shared ? <Avatar email={device.owner.email} size={22} /> : <AvatarList users={device?.access} />,
  }),
  new DeviceAttribute({
    id: 'lastReported',
    label: 'Last reported',
    defaultWidth: 175,
    value: ({ device }) => (
      <>
        <Timestamp startDate={device?.lastReported} /> &nbsp;
        {device?.state === 'active' && (
          <Typography variant="caption" component="div">
            since refresh
          </Typography>
        )}
      </>
    ),
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
        multiline: true,
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
export const restoreAttributes = attributes.filter(a => a.type === 'RESTORE')

export function getAttribute(id: string): Attribute {
  return attributeLookup[id]
}

export function getAttributes(ids: string[]): Attribute[] {
  return ids.map(id => attributeLookup[id])
}
