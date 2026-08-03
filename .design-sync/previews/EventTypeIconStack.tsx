import React from 'react'
import { EventTypeIconStack } from 'remoteit-desktop-frontend'

/**
 * EventTypeIconStack previews an event-filter option: one glyph when the filter
 * covers a single event type, two overlapping chips when it covers a pair
 * (e.g. "Device State" = came online / went offline). Items are real IEvent
 * objects — the stack renders EventTypeIcon → EventIcon underneath.
 */

const user: any = { id: 'u-8f21', email: 'jamie@remote.it' }

const event = (over: Record<string, any>): any => ({
  id: 'ev-1c4a',
  shared: false,
  scripting: false,
  timestamp: new Date('2024-11-04T18:22:00Z'),
  action: '',
  ...over,
})

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode; width?: number }> = ({
  label,
  children,
  width = 128,
}) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 7, width }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 30 }}>{children}</div>
    <span
      style={{
        fontSize: 11,
        lineHeight: 1.35,
        opacity: 0.55,
        fontFamily: 'system-ui',
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
    >
      {label}
    </span>
  </div>
)

/* The pairs the app's own eventFilterOptions produce, one per filter row. */
const connectPair = [
  event({ type: 'DEVICE_CONNECT', state: 'connected' }),
  event({ type: 'DEVICE_CONNECT', state: 'disconnected' }),
]
const sharePair = [event({ type: 'DEVICE_SHARE', action: 'add' }), event({ type: 'DEVICE_DELETE' })]
const jobPair = [event({ type: 'DEVICE_JOB', action: 'success' }), event({ type: 'DEVICE_JOB', action: 'failed' })]
const authPair = [event({ type: 'AUTH_LOGIN' }), event({ type: 'AUTH_LOGIN_ATTEMPT' })]
const runningPair = [event({ type: 'JOB', action: 'running' }), event({ type: 'JOB', action: 'waiting' })]

/** One item — the stack short-circuits to a bare EventTypeIcon, no chip well. */
export const SingleType = () => (
  <Row>
    <Cell label="items=[AUTH_LOGIN]">
      <EventTypeIconStack items={[event({ type: 'AUTH_LOGIN' })]} user={user} />
    </Cell>
    <Cell label="items=[AUTH_MFA_ENABLED]">
      <EventTypeIconStack items={[event({ type: 'AUTH_MFA_ENABLED' })]} user={user} />
    </Cell>
    <Cell label="items=[LICENSE_UPDATED]">
      <EventTypeIconStack items={[event({ type: 'LICENSE_UPDATED' })]} user={user} />
    </Cell>
    <Cell label="items=[DEVICE_STATE state='active']">
      <EventTypeIconStack items={[event({ type: 'DEVICE_STATE', state: 'active' })]} user={user} />
    </Cell>
    <Cell label="items=[DEVICE_DELETE]">
      <EventTypeIconStack items={[event({ type: 'DEVICE_DELETE' })]} user={user} />
    </Cell>
  </Row>
)

/** Two or more items — only the first two are drawn, in overlapping wells. */
export const StackedPairs = () => (
  <Row>
    <Cell label="Device Connection · connected + disconnected">
      <EventTypeIconStack items={connectPair} user={user} />
    </Cell>
    <Cell label="Device Sharing · share + delete">
      <EventTypeIconStack items={sharePair} user={user} />
    </Cell>
    <Cell label="Script Run · success + failed">
      <EventTypeIconStack items={jobPair} user={user} />
    </Cell>
    <Cell label="Login Activity · login + attempt">
      <EventTypeIconStack items={authPair} user={user} />
    </Cell>
    <Cell label="Script Run · running + waiting">
      <EventTypeIconStack items={runningPair} user={user} />
    </Cell>
  </Row>
)

/* The chip well is 20px, so the grayLightest → primaryHighlight swap is a
   couple of pixels of tint. Magnified here or the two states read as one. */
const ZoomCell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 8, width: 150 }}>
    <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: 'scale(2.6)', transformOrigin: 'center' }}>{children}</div>
    </div>
    <span
      style={{
        fontSize: 11,
        lineHeight: 1.35,
        opacity: 0.55,
        fontFamily: 'system-ui',
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
    >
      {label}
    </span>
  </div>
)

/**
 * `selected` swaps the chip well from grayLightest to primaryHighlight — shown
 * at 2.6× because at native size the tint is only a few pixels wide.
 */
export const SelectedState = () => (
  <Row>
    <ZoomCell label="2.6× · selected={false} · grayLightest well">
      <EventTypeIconStack items={connectPair} user={user} />
    </ZoomCell>
    <ZoomCell label="2.6× · selected · primaryHighlight well">
      <EventTypeIconStack items={connectPair} user={user} selected />
    </ZoomCell>
    <ZoomCell label="2.6× · selected={false}">
      <EventTypeIconStack items={jobPair} user={user} />
    </ZoomCell>
    <ZoomCell label="2.6× · selected · primaryHighlight well">
      <EventTypeIconStack items={jobPair} user={user} selected />
    </ZoomCell>
  </Row>
)

/** `spacing` (default 10) is the horizontal offset of the second chip. */
export const Spacing = () => (
  <Row>
    {[0, 6, 10, 14, 20].map(spacing => (
      <Cell key={spacing} label={spacing === 10 ? 'spacing=10 (default)' : `spacing=${spacing}`}>
        <EventTypeIconStack items={sharePair} user={user} spacing={spacing} selected />
      </Cell>
    ))}
  </Row>
)

/** In context: the event-type filter menu, where one row is selected. */
export const InFilterMenu = () => {
  const rows: [string, any[], boolean][] = [
    ['Login Activity', authPair, false],
    ['Device Connection', connectPair, true],
    ['Device Sharing', sharePair, false],
    ['Script Run', jobPair, false],
    ['License Updated', [event({ type: 'LICENSE_UPDATED' })], false],
  ]
  return (
    <div style={{ width: 260, fontFamily: 'system-ui' }}>
      {rows.map(([label, items, selected]) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '8px 12px',
            borderRadius: 6,
            background: selected ? 'rgba(0,150,231,0.08)' : 'transparent',
          }}
        >
          <EventTypeIconStack items={items} user={user} selected={selected} />
          <span style={{ fontSize: 13, color: selected ? '#0096e7' : undefined, fontWeight: selected ? 500 : 400 }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
