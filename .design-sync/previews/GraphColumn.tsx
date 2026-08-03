import React from 'react'
import { GraphColumn } from 'remoteit-desktop-frontend'

/* GraphColumn is a GridList column *header*: it prints the humanized time-series
   type and absolutely-positions a settings shortcut at top/right. It therefore
   needs a positioned, sized parent to sit in — this mimics the column header cell. */
const HeaderCell: React.FC<{ width?: number; children?: React.ReactNode }> = ({ width = 220, children }) => (
  <div
    style={{
      position: 'relative',
      width,
      minHeight: 26,
      display: 'flex',
      alignItems: 'center',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      opacity: 0.85,
      borderBottom: '1px solid rgba(0,0,0,0.08)',
    }}
  >
    {children}
  </div>
)

const series = (type: any, resolution: any, length: number, stepMs: number): any => {
  const end = new Date('2026-08-01T00:00:00Z')
  const start = new Date(end.getTime() - stepMs * length)
  return {
    type,
    resolution,
    start,
    end,
    data: Array.from({ length }, (_, i) => i),
    time: Array.from({ length }, (_, i) => new Date(start.getTime() + stepMs * i)),
  }
}

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const WEEK = 7 * DAY

/** Device columns — the label is the humanized time-series type. */
export const DeviceGraphHeaders = () => (
  <div style={{ display: 'grid', gap: 12 }}>
    <HeaderCell>
      <GraphColumn title="Graph" timeSeries={series('ONLINE_DURATION', 'DAY', 7, DAY)} />
    </HeaderCell>
    <HeaderCell>
      <GraphColumn title="Graph" timeSeries={series('AVAILABILITY', 'HOUR', 24, HOUR)} />
    </HeaderCell>
    <HeaderCell>
      <GraphColumn title="Graph" timeSeries={series('ONLINE', 'DAY', 14, DAY)} />
    </HeaderCell>
  </div>
)

/** Service/connection columns. */
export const ServiceGraphHeaders = () => (
  <div style={{ display: 'grid', gap: 12 }}>
    <HeaderCell>
      <GraphColumn title="Graph" timeSeries={series('CONNECT_DURATION', 'DAY', 7, DAY)} />
    </HeaderCell>
    <HeaderCell>
      <GraphColumn title="Graph" timeSeries={series('USAGE', 'HOUR', 24, HOUR)} />
    </HeaderCell>
    <HeaderCell>
      <GraphColumn title="Graph" timeSeries={series('DISCONNECT', 'WEEK', 4, WEEK)} />
    </HeaderCell>
  </div>
)

/* The header label comes only from `timeSeries.type`, so a resolution sweep is
   identical on screen — the window length lives in the settings button's tooltip.
   The caption spells out what that hidden tooltip reports. */
const ResolutionRow: React.FC<{ caption: string; children?: React.ReactNode }> = ({ caption, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <HeaderCell width={200}>{children}</HeaderCell>
    <span style={{ fontSize: 11, opacity: 0.55, whiteSpace: 'nowrap' }}>{caption}</span>
  </div>
)

/** The settings shortcut's tooltip reports the window length from the resolution. */
export const Resolutions = () => (
  <div style={{ display: 'grid', gap: 12 }}>
    <ResolutionRow caption='resolution HOUR × 24 → tooltip "Last 24 hours"'>
      <GraphColumn title="Graph" timeSeries={series('ONLINE_DURATION', 'HOUR', 24, HOUR)} />
    </ResolutionRow>
    <ResolutionRow caption='resolution DAY × 30 → tooltip "Last 30 days"'>
      <GraphColumn title="Graph" timeSeries={series('ONLINE_DURATION', 'DAY', 30, DAY)} />
    </ResolutionRow>
    <ResolutionRow caption='resolution WEEK × 12 → tooltip "Last 12 weeks"'>
      <GraphColumn title="Graph" timeSeries={series('ONLINE_DURATION', 'WEEK', 12, WEEK)} />
    </ResolutionRow>
  </div>
)

/** With no time series it degrades to the plain column title, no settings button. */
export const NoTimeSeries = () => (
  <div style={{ display: 'grid', gap: 12 }}>
    <HeaderCell>
      <GraphColumn title="Uptime" />
    </HeaderCell>
    <HeaderCell>
      <GraphColumn title="Connection activity" />
    </HeaderCell>
  </div>
)
