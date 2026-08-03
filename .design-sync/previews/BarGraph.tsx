import React from 'react'
import { BarGraph } from 'remoteit-desktop-frontend'

/* ITimeSeries = { type, resolution, start, end, time: Date[], data: number[] } */
const series = (
  type: any,
  resolution: any,
  data: number[],
  endISO = '2026-08-01T00:00:00Z',
  stepMs = 24 * 60 * 60 * 1000
): any => {
  const end = new Date(endISO)
  const start = new Date(end.getTime() - stepMs * data.length)
  return {
    type,
    resolution,
    start,
    end,
    data,
    time: data.map((_, i) => new Date(start.getTime() + stepMs * i)),
  }
}

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

/* Seconds online per day over two weeks — one bad day where the shop lost power. */
const onlineDuration = series(
  'ONLINE_DURATION',
  'DAY',
  [86400, 86400, 86400, 85920, 86400, 86400, 71280, 0, 43200, 86400, 86400, 86400, 84600, 86400],
  '2026-08-01T00:00:00Z',
  DAY
)

/* Connected percentage per hour over the last 24h. */
const usage = series(
  'USAGE',
  'HOUR',
  [4, 2, 0, 0, 0, 0, 11, 38, 62, 74, 81, 77, 45, 68, 88, 92, 79, 55, 31, 18, 9, 6, 3, 2],
  '2026-08-01T00:00:00Z',
  HOUR
)

/* Connect events per day. */
const connects = series('CONNECT', 'DAY', [3, 7, 5, 12, 9, 2, 0, 4, 11, 14, 6, 8, 5, 9], '2026-08-01T00:00:00Z', DAY)

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
    {children}
    <span style={{ fontSize: 10, opacity: 0.6 }}>{label}</span>
  </div>
)

/** Default 100x18 sparkline — the size used inside a device list row. */
export const Sparkline = () => (
  <Row>
    <Cell label="ONLINE_DURATION / 14d">
      <BarGraph data={onlineDuration} />
    </Cell>
    <Cell label="USAGE / 24h">
      <BarGraph data={usage} color="primary" />
    </Cell>
    <Cell label="CONNECT / 14d">
      <BarGraph data={connects} color="success" />
    </Cell>
  </Row>
)

/** Palette colors — `primary` is the Remote.It brand blue. */
export const Colors = () => (
  <Row>
    {(['primary', 'success', 'warning', 'danger', 'gray', 'grayDark'] as const).map(color => (
      <Cell key={color} label={color}>
        <BarGraph data={usage} color={color} width={120} height={30} />
      </Cell>
    ))}
  </Row>
)

/** Wider / taller variants for the device details panel. */
export const Sizes = () => (
  <Row>
    <Cell label="100 x 18 (default)">
      <BarGraph data={usage} color="primary" />
    </Cell>
    <Cell label="200 x 40">
      <BarGraph data={usage} color="primary" width={200} height={40} />
    </Cell>
    <Cell label="320 x 72">
      <BarGraph data={usage} color="primary" width={320} height={72} />
    </Cell>
  </Row>
)

/* A flaky device that never manages a full day online — peak is 61200s (17h). */
const partialUptime = series(
  'ONLINE_DURATION',
  'DAY',
  [43200, 61200, 25200, 54000, 10800, 39600, 57600, 32400, 61200, 18000, 46800, 50400, 28800, 43200],
  '2026-08-01T00:00:00Z',
  DAY
)

/** An explicit `max` fixes the y-scale — here a full day of uptime (86400s). */
export const FixedScale = () => (
  <Row>
    <Cell label="auto max — peak 17h fills the box">
      <BarGraph data={partialUptime} color="success" width={220} height={56} />
    </Cell>
    <Cell label="max=86400 — same data against a full day">
      <BarGraph data={partialUptime} color="success" width={220} height={56} max={86400} />
    </Cell>
  </Row>
)

/** Gaps and flat series still draw an axis rather than collapsing. */
export const SparseData = () => (
  <Row>
    <Cell label="intermittent uptime">
      <BarGraph
        data={series(
          'ONLINE_DURATION',
          'DAY',
          [0, 10800, 3600, 0, 21600, 86400, 7200],
          '2026-08-01T00:00:00Z',
          DAY
        )}
        color="warning"
        width={200}
        height={44}
      />
    </Cell>
    <Cell label="always online">
      <BarGraph
        data={series('AVAILABILITY', 'DAY', [100, 100, 100, 100, 100, 100, 100], '2026-08-01T00:00:00Z', DAY)}
        color="success"
        width={200}
        height={44}
      />
    </Cell>
  </Row>
)
