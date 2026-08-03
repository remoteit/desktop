import React from 'react'
import { TimeSeries } from 'remoteit-desktop-frontend'

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

const series = (type: any, resolution: any, data: number[], stepMs: number): any => {
  const end = new Date('2026-08-01T00:00:00Z')
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

/* Seconds online per day, 14 days — one outage. */
const onlineDuration = series(
  'ONLINE_DURATION',
  'DAY',
  [86400, 86400, 86400, 85920, 86400, 86400, 71280, 0, 43200, 86400, 86400, 86400, 84600, 86400],
  DAY
)
/* Seconds connected per day, 14 days (a CONNECT_DURATION series draws primary blue). */
const connectDuration = series(
  'CONNECT_DURATION',
  'DAY',
  [1820, 5400, 3120, 9600, 7250, 640, 0, 2400, 8100, 12400, 4300, 6600, 3900, 7400],
  DAY
)
/* Online percentage per hour, last 24h. */
const availability = series(
  'AVAILABILITY',
  'HOUR',
  [100, 100, 100, 98, 100, 100, 100, 87, 100, 100, 100, 100, 62, 100, 100, 100, 100, 100, 94, 100, 100, 100, 100, 100],
  HOUR
)
/* Connect events per day. */
const connects = series('CONNECT', 'DAY', [3, 7, 5, 12, 9, 2, 0, 4, 11, 14, 6, 8, 5, 9], DAY)

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
    {children}
    <span style={{ fontSize: 10, opacity: 0.6 }}>{label}</span>
  </div>
)

/** `small` (default) is the inline sparkline used in the device list column. */
export const SmallInline = () => (
  <Row>
    <Cell label="ONLINE_DURATION / 14d">
      <TimeSeries timeSeries={onlineDuration} online />
    </Cell>
    <Cell label="CONNECT_DURATION / 14d">
      <TimeSeries timeSeries={connectDuration} />
    </Cell>
    <Cell label="CONNECT events / 14d">
      <TimeSeries timeSeries={connects} online />
    </Cell>
  </Row>
)

/** Color is derived, not passed: connection types are blue, device types follow `online`. */
export const OnlineVersusOffline = () => (
  <Row>
    <Cell label="online (success)">
      <TimeSeries timeSeries={onlineDuration} online width={160} height={34} />
    </Cell>
    <Cell label="offline (gray)">
      <TimeSeries timeSeries={onlineDuration} online={false} width={160} height={34} />
    </Cell>
    <Cell label="connection type (primary)">
      <TimeSeries timeSeries={connectDuration} width={160} height={34} />
    </Cell>
  </Row>
)

/** `large` adds the y-axis min/max and the "Last 14d" caption. */
export const LargeUptime = () => <TimeSeries timeSeries={onlineDuration} online variant="large" />

/** Large variant on an hourly availability series — the axis reads in percent. */
export const LargeAvailability = () => <TimeSeries timeSeries={availability} online variant="large" />

/** Large variant for connection usage; the y-axis is humanized duration. */
export const LargeConnectedTime = () => <TimeSeries timeSeries={connectDuration} variant="large" />
