import React from 'react'
import { ServiceMiniState } from 'remoteit-desktop-frontend'

// ServiceMiniState is the tiny type-badge that fills the "services" column of
// the device list: one chip per service, tinted by the combined service +
// connection state (offline is struck through, a live connection turns brand
// blue, a connection error turns red) and overridden by the license chip color
// when the service is on an evaluation or is unlicensed. A public link on the
// service adds the globe/key glyph inside the chip.

const service = (over: any = {}): any => ({
  id: '80:1A:2B:00:3C:4D',
  name: 'SSH',
  type: 'SSH',
  state: 'active',
  license: 'LICENSED',
  deviceID: '80:1A:2B:00:3C:4D',
  typeID: 28,
  port: 22,
  host: '127.0.0.1',
  access: [],
  attributes: {},
  ...over,
})

const Grid: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: 110 }}>
    <div style={{ minHeight: 22, display: 'flex', alignItems: 'center' }}>{children}</div>
    <span style={{ fontSize: 11, opacity: 0.6, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
  </div>
)

export const States = () => (
  <Grid>
    <Cell label="active — service online">
      <ServiceMiniState service={service({ type: 'SSH' })} />
    </Cell>
    <Cell label="inactive — offline, struck through">
      <ServiceMiniState service={service({ type: 'SSH', state: 'inactive' })} />
    </Cell>
    <Cell label="connected — connection up">
      <ServiceMiniState service={service({ type: 'SSH' })} connection={{ id: 'c1', enabled: true, connected: true }} />
    </Cell>
    <Cell label="transition — disconnecting">
      <ServiceMiniState service={service({ type: 'VNC' })} connection={{ id: 'c2', enabled: false, stopping: true }} />
    </Cell>
    <Cell label="error — connection failed">
      <ServiceMiniState
        service={service({ type: 'HTTP' })}
        connection={{ id: 'c3', enabled: true, error: { message: 'connection refused on port 80' } }}
      />
    </Cell>
  </Grid>
)

export const Licensing = () => (
  <Grid>
    <Cell label="LICENSED — state color">
      <ServiceMiniState service={service({ type: 'SSH', license: 'LICENSED' })} />
    </Cell>
    <Cell label="EVALUATION — warning">
      <ServiceMiniState service={service({ type: 'SSH', license: 'EVALUATION' })} />
    </Cell>
    <Cell label="UNLICENSED — warning">
      <ServiceMiniState service={service({ type: 'VNC', license: 'UNLICENSED' })} />
    </Cell>
    <Cell label="EVALUATION + connected">
      <ServiceMiniState
        service={service({ type: 'TCP', license: 'EVALUATION' })}
        connection={{ id: 'c4', enabled: true, connected: true }}
      />
    </Cell>
  </Grid>
)

const linked = (web: boolean, over: any = {}) =>
  service({
    ...over,
    link: {
      url: 'https://link.remote.it/shop-floor-pi/http',
      web,
      code: 'a1f4c8e2',
      created: new Date('2026-07-14T09:02:00Z'),
      enabled: true,
    },
  })

export const WithPublicLink = () => (
  <Grid>
    <Cell label="web link — globe inside chip">
      <ServiceMiniState service={linked(true, { type: 'HTTP' })} />
    </Cell>
    <Cell label="key link — key inside chip">
      <ServiceMiniState service={linked(false, { type: 'TCP' })} />
    </Cell>
    <Cell label="web link + connected">
      <ServiceMiniState service={linked(true, { type: 'HTTP' })} connection={{ id: 'c5', enabled: true, connected: true }} />
    </Cell>
    <Cell label="key link + offline">
      <ServiceMiniState service={linked(false, { type: 'TCP', state: 'inactive' })} />
    </Cell>
  </Grid>
)

// The column it was designed for: every service on a device, side by side, so
// the whole device's posture reads at a glance.
const DeviceRow: React.FC<{ name: string; children?: React.ReactNode }> = ({ name, children }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '170px 1fr',
      alignItems: 'center',
      gap: 12,
      fontSize: 13,
      padding: '9px 0',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
    }}
  >
    <span style={{ fontWeight: 500 }}>{name}</span>
    <span>{children}</span>
  </div>
)

export const InDeviceList = () => (
  <div style={{ maxWidth: 470 }}>
    <DeviceRow name="shop-floor-pi">
      <ServiceMiniState service={service({ type: 'SSH' })} connection={{ id: 'a1', enabled: true, connected: true }} />
      <ServiceMiniState service={linked(true, { type: 'HTTP' })} />
      <ServiceMiniState service={service({ type: 'VNC' })} />
    </DeviceRow>
    <DeviceRow name="warehouse-gateway">
      <ServiceMiniState service={service({ type: 'SSH' })} />
      <ServiceMiniState service={service({ type: 'TCP', license: 'EVALUATION' })} />
      <ServiceMiniState
        service={service({ type: 'HTTP' })}
        connection={{ id: 'a2', enabled: true, error: { message: 'timed out' } }}
      />
    </DeviceRow>
    <DeviceRow name="cold-storage-sensor">
      <ServiceMiniState service={service({ type: 'SSH', state: 'inactive' })} />
      <ServiceMiniState service={service({ type: 'Modbus', state: 'inactive' })} />
    </DeviceRow>
    <DeviceRow name="austin-office-router">
      <ServiceMiniState service={service({ type: 'SSH' })} connection={{ id: 'a3', enabled: false, stopping: true }} />
      <ServiceMiniState service={linked(false, { type: 'TCP' })} />
      <ServiceMiniState service={service({ type: 'HTTP', license: 'UNLICENSED' })} />
    </DeviceRow>
  </div>
)
