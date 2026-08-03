import React from 'react'
import { DataDisplay, Timestamp, Percent, Round, Icon } from 'remoteit-desktop-frontend'

/* The real `Attribute` class isn't part of the DS entry (componentSrcMap has
   Attribute: null), so these are duck-typed to the shape DataDisplay actually
   consumes: { id, label, help?, align?, multiline?, value(options), show(limits) }.
   `copyable` is deliberately left off — the copy button pulls in redux. */
type PreviewAttribute = {
  id: string
  label: string
  help?: string
  align?: 'left' | 'right' | 'center'
  multiline?: boolean
  feature?: string
  value: (options: any) => React.ReactNode
  show: (limits?: Record<string, boolean>) => boolean
}

const attr = (o: Omit<PreviewAttribute, 'show'>): any => ({
  ...o,
  show(limits?: Record<string, boolean>) {
    return !o.feature || !limits ? true : !!limits[o.feature]
  },
})

const device: any = {
  id: '80:00:01:9F:00:3A:1B:C4',
  name: 'shop-floor-pi',
  state: 'active',
  hardwareId: 'b8:27:eb:4c:19:07',
  version: 4.22,
  platform: 1121,
  license: 'LICENSED',
  lastReported: new Date('2026-07-31T14:22:09'),
  createdAt: new Date('2024-03-04T09:05:00'),
  availability: 99.94,
  quality: 'GOOD',
  externalAddress: '73.109.44.18',
  internalAddress: '192.168.4.31',
  notes: 'Bay 3 line controller.\nReboots nightly at 02:00 local.',
}

const service: any = {
  id: '80:00:01:9F:00:3A:1B:C4:00',
  name: 'SSH',
  port: 22,
  host: '127.0.0.1',
  type: 'SSH',
  protocol: 'TCP',
  enabled: true,
  timeout: 15,
  latency: 18.42,
  sessions: 3,
}

/** Device details — the attribute set shown on the device page. */
export const DeviceDetails = () => (
  <DataDisplay
    device={device}
    attributes={[
      attr({ id: 'deviceName', label: 'Name', value: ({ device }) => device.name }),
      attr({ id: 'deviceId', label: 'Device ID', value: ({ device }) => device.id }),
      attr({ id: 'hardwareId', label: 'Hardware ID', value: ({ device }) => device.hardwareId }),
      attr({ id: 'version', label: 'Daemon version', value: ({ device }) => `v${device.version}` }),
      attr({
        id: 'lastReported',
        label: 'Last reported',
        value: ({ device }) => <Timestamp date={device.lastReported} variant="minutes" />,
      }),
      attr({
        id: 'availability',
        label: 'Availability',
        value: ({ device }) => <Percent value={device.availability} />,
      }),
    ]}
  />
)

/** Service details, with a right-aligned numeric column. */
export const ServiceDetails = () => (
  <DataDisplay
    width={130}
    service={service}
    attributes={[
      attr({
        id: 'serviceName',
        label: 'Service',
        value: ({ service }) => (
          <span>
            <Icon name="terminal" size="sm" inlineLeft />
            {service.name}
          </span>
        ),
      }),
      attr({ id: 'serviceId', label: 'Service ID', value: ({ service }) => service.id }),
      attr({ id: 'target', label: 'Target', value: ({ service }) => `${service.host}:${service.port}` }),
      attr({ id: 'protocol', label: 'Protocol', value: ({ service }) => service.protocol }),
      attr({ id: 'latency', label: 'Latency', value: ({ service }) => <><Round value={service.latency} /> ms</> }),
      attr({ id: 'timeout', label: 'Idle timeout', value: ({ service }) => `${service.timeout} min` }),
    ]}
  />
)

/** `help` renders a superscript question mark with a tooltip on the label. */
export const WithHelpText = () => (
  <DataDisplay
    device={device}
    attributes={[
      attr({
        id: 'externalAddress',
        label: 'External IP',
        help: 'The public address the device reported at its last check-in.',
        value: ({ device }) => device.externalAddress,
      }),
      attr({
        id: 'internalAddress',
        label: 'Internal IP',
        help: 'The address of the device on its own LAN.',
        value: ({ device }) => device.internalAddress,
      }),
      attr({
        id: 'quality',
        label: 'Connection quality',
        help: 'Rolling 24 hour rating derived from packet loss and latency.',
        value: ({ device }) => device.quality,
      }),
    ]}
  />
)

/** `limits` gates attributes by plan feature — `persistentConnections` is off here. */
export const GatedByPlanLimits = () => (
  <DataDisplay
    device={device}
    limits={{ deviceTimeSeries: true, persistentConnections: false }}
    attributes={[
      attr({ id: 'deviceName', label: 'Name', value: ({ device }) => device.name }),
      attr({
        id: 'availability',
        label: 'Availability',
        feature: 'deviceTimeSeries',
        value: ({ device }) => <Percent value={device.availability} />,
      }),
      attr({
        id: 'persistent',
        label: 'Persistent route',
        feature: 'persistentConnections',
        value: () => 'Enabled',
      }),
      attr({
        id: 'claimed',
        label: 'Claimed',
        value: ({ device }) => <Timestamp date={device.createdAt} variant="long" />,
      }),
    ]}
  />
)

/** `multiline` preserves newlines; `disablePadding` tightens the list. */
export const MultilineAndCompact = () => (
  <DataDisplay
    disablePadding
    width={110}
    device={device}
    attributes={[
      attr({ id: 'deviceName', label: 'Name', value: ({ device }) => device.name }),
      attr({ id: 'notes', label: 'Notes', multiline: true, value: ({ device }) => device.notes }),
      attr({ id: 'hardwareId', label: 'Hardware ID', value: ({ device }) => device.hardwareId }),
    ]}
  />
)
