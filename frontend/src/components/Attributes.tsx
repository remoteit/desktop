import React from 'react'
import { IP_LATCH, PROTOCOL } from '../shared/constants'
import { TargetPlatform } from './TargetPlatform'
import { QualityDetails } from './QualityDetails'
import { ServiceIndicators } from './ServiceIndicators'
import { INITIATOR_PLATFORMS } from './InitiatorPlatform'
import { ListItemText, Chip, Typography } from '@mui/material'
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
import { Icon } from './Icon'
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
  query?: string // key to device query - fall back to id
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
    query?: string
    type?: Attribute['type']
    value?: Attribute['value']
  }) {
    Object.assign(this, options)
  }

  show(feature?: ILookup<boolean>) {
    return !this.feature || !feature ? true : feature[this.feature]
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

// @TODO  display more service / device attributes  and more of the geo data

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
    query: 'deviceName',
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
    query: 'endpoint',
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
    id: 'targetPlatform',
    label: 'Platform',
    defaultWidth: 180,
    value: ({ device }) => TargetPlatform({ id: device?.targetPlatform, label: true }),
  }),
  new DeviceAttribute({
    id: 'quality',
    query: 'endpoint',
    label: 'Stability',
    value: ({ device }) => <QualityDetails device={device} />,
    column: false,
  }),
  new DeviceAttribute({
    id: 'permissions',
    label: 'Permissions',
    defaultWidth: 210,
    value: ({ device }) => {
      return device?.permissions.map(p => <Chip label={PERMISSION[p]?.name} size="small" variant="outlined" key={p} />)
    },
  }),
  new DeviceAttribute({
    id: 'role',
    query: 'owner',
    label: 'Role',
    defaultWidth: 210,
    value: ({ device }) => <DeviceRole device={device} />,
  }),
  new DeviceAttribute({
    id: 'owner',
    label: 'Owner',
    defaultWidth: 210,
    value: ({ device }) =>
      device && (
        <Avatar email={device.owner.email} size={22} inline>
          {device.owner.email}
        </Avatar>
      ),
  }),
  new DeviceAttribute({
    id: 'access',
    label: 'Users',
    defaultWidth: 200,
    value: ({ device }) => <AvatarList users={device?.shared ? [device.owner] : device?.access} size={22} />,
  }),
  new DeviceAttribute({
    id: 'license',
    label: 'License',
    defaultWidth: 100,
    value: ({ device }) => <LicenseChip license={device?.license} />,
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
  new DeviceAttribute({
    id: 'created',
    label: 'Created date',
    defaultWidth: 175,
    value: ({ device }) => (device?.createdAt ? <Timestamp startDate={device.createdAt} /> : undefined),
  }),
  new DeviceAttribute({
    id: 'isp',
    query: 'endpoint',
    label: 'ISP',
    value: ({ device }) => device?.geo?.isp,
  }),
  new DeviceAttribute({
    id: 'connectionType',
    query: 'endpoint',
    label: 'Connection type',
    value: ({ device }) => device?.geo?.connectionType,
  }),
  new DeviceAttribute({
    id: 'location',
    query: 'endpoint',
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
    query: 'endpoint',
    defaultWidth: 115,
    value: ({ device }) => device?.geo?.city,
  }),
  new DeviceAttribute({
    id: 'state',
    label: 'State',
    query: 'endpoint',
    defaultWidth: 100,
    value: ({ device }) => device?.geo?.stateName,
  }),
  new DeviceAttribute({
    id: 'country',
    label: 'Country',
    query: 'endpoint',
    defaultWidth: 130,
    value: ({ device }) => device?.geo?.countryName,
  }),
  new DeviceAttribute({
    id: 'externalAddress',
    label: 'External IP',
    query: 'endpoint',
    defaultWidth: 180,
    value: ({ device }) => device?.externalAddress,
  }),
  new DeviceAttribute({
    id: 'internalAddress',
    label: 'Internal IP',
    query: 'endpoint',
    value: ({ device }) => device?.internalAddress,
  }),
  new DeviceAttribute({
    id: 'id',
    label: 'Device ID',
    defaultWidth: 180,
    value: ({ device }) => device?.id,
  }),
  new DeviceAttribute({
    id: 'hardwareId',
    label: 'Hardware ID',
    defaultWidth: 190,
    value: ({ device }) => device?.hardwareId,
  }),
  new DeviceAttribute({
    id: 'version',
    label: 'Daemon version',
    defaultWidth: 80,
    value: ({ device }) => device?.version,
  }),
  // @TODO add attributes to the device model on graphql request
  ...ATTRIBUTES.map(
    a =>
      new DeviceAttribute({
        id: a.id,
        label: a.label,
        query: 'attributes',
        value: ({ device }) => device?.attributes[a.id],
        multiline: true,
      })
  ),
  new DeviceAttribute({
    id: 'initiatorPlatform',
    label: 'Platform',
    value: ({ session }) => session && INITIATOR_PLATFORMS[session.platform],
    column: false,
  }),
  new ServiceAttribute({
    id: 'connectLink',
    label: 'Connect Link',
    value: ({ service }) => `${PROTOCOL}connect/${service?.id}`,
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
  // new ServiceAttribute({
  //   id: 'serviceAccess',
  //   label: 'Users',
  //   defaultWidth: 200,
  //   value: ({ device, service }) => <AvatarList users={device?.shared ? [device.owner] : service?.access} size={22} />,
  // }),
  new ServiceAttribute({
    id: 'serviceLastReported',
    label: 'Last Reported',
    defaultWidth: 230,
    value: ({ service }) =>
      service?.state !== 'active' ? <Duration startDate={service?.lastReported} ago /> : undefined,
  }),
  new ServiceAttribute({
    id: 'serviceCreated',
    label: 'Service Created',
    defaultWidth: 175,
    value: ({ service }) => <Timestamp startDate={service?.createdAt} />,
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
      connection?.connecting
        ? 'Connecting...'
        : connection?.public
        ? connection?.connectLink
          ? 'Persistent Public Endpoint'
          : connection?.reverseProxy
          ? 'Public Reverse Proxy'
          : 'Public Proxy'
        : !connection?.connected && !session
        ? 'Idle - Connect on demand'
        : connection?.isP2P || session?.isP2P
        ? 'Peer to Peer'
        : 'Proxy',
  }),
  new ConnectionAttribute({
    id: 'security',
    label: 'Security',
    value: ({ connection }) => {
      if (!connection) return undefined

      if (connection.public)
        return connection.publicRestriction === IP_LATCH
          ? connection.reverseProxy
            ? 'Public randomized url'
            : 'This IP address only'
          : 'Public'

      return (
        <>
          <Icon name="shield-alt" type="solid" size="xxs" inlineLeft />
          {lanShared(connection) ? 'Zero Trust (LAN shared)' : 'Zero Trust'}
        </>
      )
    },
  }),
  new ConnectionAttribute({
    id: 'local',
    label: 'Local Endpoint',
    value: ({ connection }) => (connection ? `${connection.host}:${connection.port}` : undefined),
  }),
  new ConnectionAttribute({
    id: 'lanShare',
    label: 'LAN Endpoint',
    value: ({ connection }) => {
      if (connection?.ip && lanShared(connection)) return `${replaceHost(connection.ip)}:${connection.port}`
    },
  }),
]

const attributeLookup = toLookup<Attribute>(attributes, 'id')

export const masterAttributes = attributes.filter(a => a.type === 'MASTER')
export const deviceAttributes = attributes.filter(a => a.type === 'DEVICE')
export const serviceAttributes = attributes.filter(a => a.type === 'SERVICE')
export const restoreAttributes = attributes.filter(a => a.type === 'RESTORE')

export function getAttribute(id: string): Attribute {
  return attributeLookup[id] || new Attribute({ id: 'unknown', label: 'Unknown' })
}

export function getAttributes(ids: string[]): Attribute[] {
  return ids.map(id => getAttribute(id))
}

export function getColumns(feature?: ILookup<boolean>) {
  return masterAttributes.concat(deviceAttributes).filter(a => a.column && a.show(feature))
}
