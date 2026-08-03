import React from 'react'
import { ServiceLinkIcon } from 'remoteit-desktop-frontend'

// ServiceLinkIcon marks a service that has a persistent public link enabled.
// It renders a globe for a web link (https URL anyone can open) and a key for a
// non-web link (raw TCP endpoint reached with the connect key), and renders
// nothing at all when the service has no link or the link is switched off —
// which is why it can be dropped inline anywhere without a conditional.
// It forwards every Icon prop, so callers pick size/weight/color per context.

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
  link: {
    url: 'https://link.remote.it/shop-floor-pi/ssh',
    web: true,
    code: 'a1f4c8e2',
    created: new Date('2026-07-14T09:02:00Z'),
    enabled: true,
  },
  ...over,
})

const webLink = service()
const keyLink = service({
  name: 'Modbus TCP',
  type: 'TCP',
  port: 502,
  link: { ...service().link, web: false, password: 'set' },
})
const offLink = service({ name: 'VNC', type: 'VNC', port: 5900, link: { ...service().link, enabled: false } })
const noLink = service({ name: 'HTTP', type: 'HTTP', port: 80, link: undefined })

const Grid: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 26, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: 96 }}>
    <div style={{ minHeight: 24, display: 'flex', alignItems: 'center' }}>{children}</div>
    <span style={{ fontSize: 11, opacity: 0.6, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
  </div>
)

// The empty slots are the point: a disabled or absent link must render nothing,
// so they are outlined to show the icon really did opt out.
const Empty: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span style={{ border: '1px dashed rgba(0,0,0,0.25)', borderRadius: 4, padding: '2px 10px', minHeight: 22 }}>
    {children}
  </span>
)

export const LinkTypes = () => (
  <Grid>
    <Cell label="web link — globe">
      <ServiceLinkIcon service={webLink} size="md" />
    </Cell>
    <Cell label="key link — key">
      <ServiceLinkIcon service={keyLink} size="md" />
    </Cell>
    <Cell label="link disabled — nothing">
      <Empty>
        <ServiceLinkIcon service={offLink} size="md" />
      </Empty>
    </Cell>
    <Cell label="no link — nothing">
      <Empty>
        <ServiceLinkIcon service={noLink} size="md" />
      </Empty>
    </Cell>
  </Grid>
)

export const Sizes = () => (
  <Grid>
    {['xxxs', 'xxs', 'xs', 'sm', 'base', 'md', 'lg'].map(size => (
      <Cell key={size} label={size}>
        <ServiceLinkIcon service={webLink} size={size as any} />
      </Cell>
    ))}
  </Grid>
)

export const WeightsAndColors = () => (
  <Grid>
    <Cell label="light">
      <ServiceLinkIcon service={webLink} type="light" size="lg" />
    </Cell>
    <Cell label="regular">
      <ServiceLinkIcon service={webLink} type="regular" size="lg" />
    </Cell>
    <Cell label="solid">
      <ServiceLinkIcon service={webLink} type="solid" size="lg" />
    </Cell>
    <Cell label="primary">
      <ServiceLinkIcon service={webLink} color="primary" size="lg" />
    </Cell>
    <Cell label="grayDark">
      <ServiceLinkIcon service={keyLink} color="grayDark" size="lg" />
    </Cell>
    <Cell label="danger">
      <ServiceLinkIcon service={keyLink} color="danger" size="lg" />
    </Cell>
  </Grid>
)

// Where it lands in product: trailing the service name in the device's service
// list, so a shared public endpoint is visible without opening the service.
export const InServiceList = () => (
  <div style={{ maxWidth: 400 }}>
    <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>
      warehouse-gateway
    </div>
    {[webLink, keyLink, offLink, noLink].map((s, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          padding: '8px 0',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <span style={{ fontWeight: 500 }}>{s.name}</span>
        <ServiceLinkIcon service={s} color="primary" size="sm" inline />
        <span style={{ marginLeft: 'auto', fontFamily: 'Roboto Mono, monospace', fontSize: 12, opacity: 0.6 }}>
          {s.host}:{s.port}
        </span>
      </div>
    ))}
  </div>
)
