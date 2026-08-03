import React from 'react'
import { Round, Icon } from 'remoteit-desktop-frontend'

const Grid: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 20px', alignItems: 'baseline' }}>
    {children}
  </div>
)

const Label: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span style={{ opacity: 0.55, fontSize: 12 }}>{children}</span>
)

/** One decimal place — trailing zeros are dropped, so 12.0 prints as "12". */
export const OneDecimalPlace = () => (
  <Grid>
    {[12.349, 12.35, 12.04, 12.05, 0.049, 0.05, 8, 1024.96].map(value => (
      <React.Fragment key={value}>
        <Label>value={value}</Label>
        <span>
          <Round value={value} />
        </span>
      </React.Fragment>
    ))}
  </Grid>
)

/** Round-trip latency per device, the component's main use. */
export const ConnectionLatency = () => (
  <div style={{ display: 'grid', gap: 10 }}>
    {[
      { name: 'shop-floor-pi', ms: 18.42, ok: true },
      { name: 'warehouse-gateway', ms: 46.98, ok: true },
      { name: 'loading-dock-cam', ms: 212.351, ok: false },
    ].map(d => (
      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="wave-pulse" color={d.ok ? 'primary' : 'warning'} size="md" />
        <span style={{ minWidth: 160 }}>{d.name}</span>
        <span style={{ minWidth: 70, textAlign: 'right' }}>
          <Round value={d.ms} />
        </span>
        <Label>ms round-trip</Label>
      </div>
    ))}
  </div>
)

/** Throughput figures — the value is unitless, the caller supplies the unit. */
export const ThroughputFigures = () => (
  <Grid>
    <Label>upload</Label>
    <span>
      <Round value={2.4471} /> <Label>MB/s</Label>
    </span>
    <Label>download</Label>
    <span>
      <Round value={11.9038} /> <Label>MB/s</Label>
    </span>
    <Label>session transfer</Label>
    <span>
      <Round value={1487.2} /> <Label>MB</Label>
    </span>
    <Label>avg concurrent sessions</Label>
    <span>
      <Round value={3.6666} />
    </span>
  </Grid>
)

/** Edge values: zero prints "0", and negatives round the same way. */
export const ZeroAndNegative = () => (
  <Grid>
    <Label>value=0</Label>
    <span>
      <Round value={0} />
    </span>
    <Label>value=-0.06</Label>
    <span>
      <Round value={-0.06} />
    </span>
    <Label>value=-14.44</Label>
    <span>
      <Round value={-14.44} />
    </span>
  </Grid>
)
