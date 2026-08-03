import React from 'react'
import { Percent, Icon } from 'remoteit-desktop-frontend'

const Grid: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 20px', alignItems: 'baseline' }}>
    {children}
  </div>
)

const Label: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span style={{ opacity: 0.55, fontSize: 12 }}>{children}</span>
)

/** Rounds to a whole number and appends `%`. */
export const RoundingSweep = () => (
  <Grid>
    {[99.94, 87.5, 66.4, 50, 12.49, 0.4].map(value => (
      <React.Fragment key={value}>
        <Label>value={value}</Label>
        <span>
          <Percent value={value} />
        </span>
      </React.Fragment>
    ))}
  </Grid>
)

/** Zero is falsy in this component, so it renders nothing rather than "0%". */
export const ZeroRendersNothing = () => (
  <Grid>
    <Label>value=0</Label>
    <span style={{ opacity: 0.4 }}>
      <Percent value={0} />
      (renders nothing)
    </span>
    <Label>value=0.4</Label>
    <span>
      <Percent value={0.4} />
    </span>
    <Label>value=100</Label>
    <span>
      <Percent value={100} />
    </span>
  </Grid>
)

/** Device availability over the last 7 days, as shown on device details. */
export const DeviceAvailability = () => (
  <div style={{ display: 'grid', gap: 10 }}>
    {[
      { name: 'shop-floor-pi', value: 99.94, online: true },
      { name: 'warehouse-gateway', value: 97.2, online: true },
      { name: 'loading-dock-cam', value: 64.31, online: false },
    ].map(d => (
      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name={d.online ? 'circle-check' : 'circle'} color={d.online ? 'success' : 'gray'} size="md" />
        <span style={{ minWidth: 160 }}>{d.name}</span>
        <span style={{ minWidth: 60, textAlign: 'right' }}>
          <Percent value={d.value} />
        </span>
        <Label>online, last 7 days</Label>
      </div>
    ))}
  </div>
)

/** Connection quality percentages from the throughput report. */
export const ConnectionQuality = () => (
  <Grid>
    <Label>packet success</Label>
    <span>
      <Percent value={99.87} />
    </span>
    <Label>peer-to-peer sessions</Label>
    <span>
      <Percent value={78.5} />
    </span>
    <Label>proxy fallback</Label>
    <span>
      <Percent value={21.5} />
    </span>
    <Label>license seats used</Label>
    <span>
      <Percent value={45.6} />
    </span>
  </Grid>
)
