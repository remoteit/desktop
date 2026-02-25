import { IP_PRIVATE } from '@common/constants'
import { Chip,ListItemText,Typography } from '@mui/material'
import React from 'react'
import { RestoreButton } from '../buttons/RestoreButton'
import { lanShareRestriction,lanShared } from '../helpers/lanSharing'
import { toLookup } from '../helpers/utilHelper'
import { PERMISSION } from '../models/organization'
import { Avatar } from './Avatar'
import { AvatarList } from './AvatarList'
import { ConnectAttribute } from './ConnectAttribute'
import { DeviceGeo } from './DeviceGeo'
import { DeviceGraphColumn } from './DeviceGraphColumn'
import { DeviceName } from './DeviceName'
import { DeviceRole } from './DeviceRole'
import { Duration } from './Duration'
import { Icon } from './Icon'
import { INITIATOR_PLATFORMS } from './InitiatorPlatform'
import { LicenseChip } from './LicenseChip'
import { Link } from './Link'
import { QualityDetails } from './QualityDetails'
import { ReactiveTags } from './ReactiveTags'
import { ServiceGraphColumn } from './ServiceGraphColumn'
import { ServiceIndicators } from './ServiceIndicators'
import { ServiceMiniState } from './ServiceMiniState'
import { StatusChip } from './StatusChip'
import { TargetPlatform } from './TargetPlatform'
import { TimeSeries } from './TimeSeries'
import { Timestamp } from './Timestamp'

export class Attribute<TOptions = IDataOptions> {
  id: string = ''
  label: string | React.ReactNode = ''
  help?: string
  required: boolean = false
  align?: 'left' | 'right' | 'center'
  defaultWidth: number = 150
  type: 'MASTER' | 'SERVICE' | 'DEVICE' | 'INSTANCE' | 'CONNECTION' | 'RESTORE' | 'CUSTOMER' | 'SCRIPT' = 'MASTER'
  feature?: string // key to plan limit name - used for tagging visibility
  multiline?: boolean
  copyable?: boolean // show copy icon on DataDisplay
  details: boolean = true // show on device details page
  column: boolean = true // show as device list column
  query?: string // key to device query - fall back to id
  value: (options: TOptions) => React.ReactNode = options => options as React.ReactNode
  width = (columnWidths: ILookup<number>) => columnWidths[this.id] || this.defaultWidth

  constructor(options: {
    id: Attribute<TOptions>['id']
    label: Attribute<TOptions>['label']
    help?: Attribute<TOptions>['help']
    required?: Attribute<TOptions>['required']
    align?: Attribute<TOptions>['align']
    column?: Attribute<TOptions>['column']
    defaultWidth?: Attribute<TOptions>['defaultWidth']
    feature?: Attribute<TOptions>['feature']
    multiline?: Attribute<TOptions>['multiline']
    copyable?: Attribute<TOptions>['copyable']
    details?: Attribute<TOptions>['details']
    query?: Attribute<TOptions>['query']
    type?: Attribute<TOptions>['type']
    value?: Attribute<TOptions>['value']
  }) {
    Object.assign(this, options)
  }

  show(feature?: ILookup<boolean>) {
    return !this.feature || !feature ? true : feature[this.feature]
  }
}

export class DeviceAttribute<TOptions = IDataOptions> extends Attribute<TOptions> {
  type: Attribute<TOptions>['type'] = 'DEVICE'
}

class InstanceAttribute<TOptions = IDataOptions> extends Attribute<TOptions> {
  type: Attribute<TOptions>['type'] = 'INSTANCE'
}

class ServiceAttribute<TOptions = IDataOptions> extends Attribute<TOptions> {
  type: Attribute<TOptions>['type'] = 'SERVICE'
}

class ConnectionAttribute<TOptions = IDataOptions> extends Attribute<TOptions> {
  type: Attribute<TOptions>['type'] = 'CONNECTION'
}

class RestoreAttribute<TOptions = IDataOptions> extends Attribute<TOptions> {
  type: Attribute<TOptions>['type'] = 'RESTORE'
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
    defaultWidth: 400,
    required: true,
    details: false,
    value: ({ device, connection }) => (
      <ListItemText
        primary={<DeviceName device={device} connection={connection} />}
        secondary={device?.thisDevice ? 'This system' : undefined}
        sx={{ marginRight: 1, opacity: device?.state === 'active' ? 1 : 0.4 }}
      />
    ),
  }),
  new ServiceAttribute({
    id: 'serviceStatus',
    label: 'Status',
    defaultWidth: 100,
    details: false,
    value: ({ service, connection }) => (
      <StatusChip service={service} connections={connection ? [connection] : undefined} />
    ),
  }),
  new ServiceAttribute({
    id: 'serviceAction',
    label: 'Action',
    details: false,
    defaultWidth: 160,
    value: ({ device, service, connection }) => <ConnectAttribute {...{ device, service, connection }} />,
  }),
  new ServiceAttribute({
    id: 'serviceName',
    query: 'serviceView',
    label: 'Service Name',
    defaultWidth: 300,
    required: true,
    details: false,
    value: ({ service, connection }) => (
      <ListItemText
        primary={<DeviceName service={service} connection={connection} />}
        sx={{ marginRight: 1, opacity: service?.state === 'active' ? 1 : 0.4 }}
      />
    ),
  }),
  new ServiceAttribute({
    id: 'serviceState',
    query: 'serviceId',
    label: 'Type',
    defaultWidth: 110,
    details: false,
    value: ({ service, connection }) => <ServiceMiniState service={service} connection={connection} />,
  }),
  new DeviceAttribute({
    id: 'status',
    label: 'Status',
    query: 'deviceName',
    defaultWidth: 100,
    value: ({ device, connections }) => <StatusChip device={device} connections={connections} />,
  }),
  new DeviceAttribute({
    id: 'deviceTimeSeries',
    query: 'deviceTimeSeries',
    label: <DeviceGraphColumn />,
    details: false,
    value: ({ device }) => (
      <Link
        to={`/devices/${device?.id}/details`}
        onClick={event => event.stopPropagation()}
        sx={{ position: 'relative', zIndex: 3, paddingTop: 1 }}
      >
        <TimeSeries timeSeries={device?.timeSeries} online={device?.state === 'active'} />
      </Link>
    ),
  }),
  new ServiceAttribute({
    id: 'serviceTimeSeries',
    details: false,
    label: <ServiceGraphColumn />,
    value: ({ device, service }) => (
      <Link
        to={`/devices/${device?.id}/${service?.id}/connect`}
        onClick={event => event.stopPropagation()}
        sx={{ position: 'relative', zIndex: 3, paddingTop: 1 }}
      >
        <TimeSeries timeSeries={service?.timeSeries} online={service?.state === 'active'} />
      </Link>
    ),
  }),
  new DeviceAttribute({
    id: 'tags',
    label: 'Tags',
    defaultWidth: 120,
    details: false,
    value: ({ instance }) => <ReactiveTags tags={instance?.tags || []} />,
    feature: 'tagging',
  }),
  new Attribute({
    id: 'qualitySmall',
    query: 'endpoint',
    label: 'Quality',
    defaultWidth: 120,
    value: ({ device }) => <QualityDetails device={device} small />,
  }),
  new DeviceAttribute({
    id: 'services',
    label: 'Services',
    details: false,
    value: ({ device, connections }) => <ServiceIndicators device={device} connections={connections} />,
    defaultWidth: 300,
  }),
  new DeviceAttribute({
    id: 'deviceDescription',
    label: 'Description',
    query: 'attributes',
    multiline: true,
    details: false,
    value: ({ device }) => device?.attributes?.description,
  }),
  new DeviceAttribute({
    id: 'targetPlatform',
    label: 'Platform',
    query: 'deviceName',
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
  new InstanceAttribute({
    id: 'permissions',
    label: 'Permissions',
    defaultWidth: 210,
    value: ({ instance }) => {
      return instance?.permissions.map(p => (
        <Chip label={PERMISSION[p]?.name} size="small" variant="outlined" key={p} />
      ))
    },
  }),
  new DeviceAttribute({
    id: 'role',
    query: 'owner',
    label: 'Role',
    defaultWidth: 100,
    value: ({ device }) => <DeviceRole device={device} />,
  }),
  new DeviceAttribute({
    id: 'configurable',
    label: 'Configurable',
    query: 'attributes',
    help: 'Can be remotely configured',
    value: ({ device }) =>
      device?.configurable ? (
        <>
          <Icon name="badge-check" color="success" type="solid" />
          &nbsp; Yes
        </>
      ) : (
        <>
          <Icon name="ban" color="danger" type="solid" />
          &nbsp; No
        </>
      ),
  }),
  new InstanceAttribute({
    id: 'owner',
    label: 'Owner',
    defaultWidth: 210,
    value: ({ instance }) =>
      instance && (
        <Avatar email={instance.owner.email} size={22} inline>
          {instance.owner.email}
        </Avatar>
      ),
  }),
  new InstanceAttribute({
    id: 'access',
    label: 'Guests',
    defaultWidth: 200,
    value: ({ instance }) => (instance?.access.length ? <AvatarList users={instance?.access} size={22} /> : null),
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
        <Timestamp date={device?.lastReported} /> &nbsp;
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
    value: ({ device }) => (device?.createdAt ? <Timestamp date={device.createdAt} /> : undefined),
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
    details: false,
    query: 'endpoint',
    defaultWidth: 115,
    value: ({ device }) => device?.geo?.city,
  }),
  new DeviceAttribute({
    id: 'state',
    label: 'State',
    details: false,
    query: 'endpoint',
    defaultWidth: 100,
    value: ({ device }) => device?.geo?.stateName,
  }),
  new DeviceAttribute({
    id: 'country',
    label: 'Country',
    details: false,
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
    copyable: true,
    defaultWidth: 180,
    value: ({ device }) => device?.id,
  }),
  new DeviceAttribute({
    id: 'hardwareId',
    label: 'Hardware ID',
    copyable: true,
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
    id: 'license',
    label: 'License',
    value: ({ service }) => <LicenseChip license={service?.license} />,
  }),
  new ServiceAttribute({
    id: 'serviceLink',
    label: 'Service Key',
    query: 'serviceView',
    details: false,
    value: ({ service }) => (service?.link?.url && !service.link.web ? <pre>{service.link.code}</pre> : null),
  }),
  new ServiceAttribute({
    id: 'serviceAccess',
    label: 'Users',
    defaultWidth: 200,
    details: false,
    value: ({ device, service }) => <AvatarList users={device?.shared ? [device.owner] : service?.access} size={22} />,
  }),
  new ServiceAttribute({
    id: 'serviceLastReported',
    label: 'Last Reported',
    defaultWidth: 230,
    value: ({ service }) =>
      service?.state !== 'active' && service?.lastReported ? (
        <Duration startDate={service.lastReported} ago />
      ) : undefined,
  }),
  new ServiceAttribute({
    id: 'serviceCreated',
    label: 'Service Created',
    defaultWidth: 175,
    value: ({ service }) => <Timestamp date={service?.createdAt} />,
  }),
  new ServiceAttribute({
    id: 'serviceHost',
    label: 'Service Host',
    defaultWidth: 130,
    value: ({ service }) => service?.host || IP_PRIVATE,
  }),
  new ServiceAttribute({
    id: 'servicePort',
    label: 'Service Port',
    defaultWidth: 130,
    value: ({ service }) => service?.port,
  }),
  new ServiceAttribute({
    id: 'serviceProtocol',
    label: 'Service Protocol',
    value: ({ service }) => service?.protocol,
  }),
  new ServiceAttribute({
    id: 'serviceType',
    label: 'Service Type',
    value: ({ service }) => service?.type,
  }),
  new ServiceAttribute({
    id: 'serviceDockerId',
    label: 'Docker ID',
    copyable: true,
    value: ({ service }) => service?.attributes.docker?.id,
  }),
  new ServiceAttribute({
    id: 'serviceDockerName',
    label: 'Docker Name',
    value: ({ service }) => service?.attributes.docker?.name,
  }),
  new ServiceAttribute({
    id: 'serviceDockerImage',
    label: 'Docker Image',
    value: ({ service }) => service?.attributes.docker?.image,
  }),
  new ServiceAttribute({
    id: 'presenceAddress',
    label: 'Presence',
    value: ({ service }) => service?.presenceAddress,
  }),
  new ServiceAttribute({
    id: 'serviceId',
    label: 'Service ID',
    copyable: true,
    value: ({ service }) => service?.id,
  }),
  new ServiceAttribute({
    id: 'serviceDeviceId',
    label: 'Device ID',
    copyable: true,
    defaultWidth: 180,
    value: ({ device }) => device?.id,
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
    value: ({ connection, session, application }) => {
      if (!connection) return null
      return connection.enabled
        ? connection.connecting
          ? 'Connecting...'
          : connection.public
          ? connection.connectLink
            ? 'Persistent Public Endpoint'
            : application?.reverseProxy
            ? 'Public Reverse Proxy'
            : 'Public Proxy'
          : !connection.connected && !session
          ? 'Idle - Connect on demand'
          : session?.source === 'WEBSOCKET'
          ? 'Peer to Peer WebSocket'
          : connection.isP2P || session?.isP2P
          ? 'Peer to Peer'
          : 'Local Proxy'
        : 'Inactive'
    },
  }),
  new ConnectionAttribute({
    id: 'session',
    label: 'Connection',
    value: ({ session, connection }) =>
      connection
        ? null
        : session?.isP2P
        ? session?.source === 'WEBSOCKET'
          ? 'Peer to Peer WebSocket'
          : 'Peer to Peer'
        : session?.manufacturer === 'ANONYMOUS'
        ? 'Public Reverse Proxy'
        : session?.manufacturer === 'KEY'
        ? 'Service Key'
        : 'Proxy',
  }),
  // new ConnectionAttribute({
  //   id: 'security',
  //   label: 'Security',
  //   value: ({ connection, application }) => {
  //     if (!connection) return undefined

  //     if (connection.public)
  //       return connection.publicRestriction === IP_LATCH
  //         ? application?.reverseProxy
  //           ? 'Public randomized url'
  //           : 'This IP address only'
  //         : 'Public'

  //     return (
  //       <>
  //         <Icon name="shield-alt" type="solid" size="xxs" inlineLeft />
  //         {lanShared(connection) ? 'Zero Trust (LAN shared)' : 'Zero Trust'}
  //       </>
  //     )
  //   },
  // }),
  new ConnectionAttribute({
    id: 'bind',
    label: 'Bind Address',
    value: ({ connection }) => {
      if (lanShared(connection)) return connection?.ip
    },
  }),
  new ConnectionAttribute({
    id: 'restrict',
    label: 'Local Security',
    value: ({ connection }) => {
      if (lanShared(connection)) return lanShareRestriction(connection)
    },
  }),
]

const attributeLookup = toLookup<Attribute>(attributes, 'id')

export const masterAttributes = attributes.filter(a => a.type === 'MASTER')
export const deviceAttributes = attributes.filter(a => ['DEVICE', 'INSTANCE'].includes(a.type))
export const deviceAttributesAll = attributes.filter(a => ['DEVICE', 'INSTANCE', 'MASTER'].includes(a.type))
export const networkAttributes = attributes.filter(a => a.type === 'INSTANCE')
export const serviceAttributes = attributes.filter(a => a.type === 'SERVICE')
export const serviceAttributesAll = attributes.filter(a => ['SERVICE', 'MASTER'].includes(a.type))
export const restoreAttributes = attributes.filter(a => a.type === 'RESTORE')
export const connectionAttributes = attributes.filter(a => a.type === 'CONNECTION')

export function getAttribute(id: string): Attribute {
  return attributeLookup[id] || new Attribute({ id: 'unknown', label: 'Unknown' })
}
