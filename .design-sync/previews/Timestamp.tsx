import React from 'react'
import { Timestamp, Icon } from 'remoteit-desktop-frontend'

const Grid: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 20px', alignItems: 'baseline' }}>
    {children}
  </div>
)

const Label: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span style={{ opacity: 0.55, fontSize: 12 }}>{children}</span>
)

/* Fixed instants so the card is deterministic between captures. */
const LAST_REPORTED = new Date('2026-07-31T14:22:09')
const CLAIMED = new Date('2024-03-04T09:05:00')

export const Variants = () => (
  <Grid>
    {(['numeric', 'minutes', 'short', 'long'] as const).map(variant => (
      <React.Fragment key={variant}>
        <Label>{variant}</Label>
        <span>
          <Timestamp date={LAST_REPORTED} variant={variant} />
        </span>
      </React.Fragment>
    ))}
  </Grid>
)

/** Recent vs. old — same variant, so the difference is only the instant. */
export const RecentVersusOld = () => (
  <Grid>
    <Label>last reported</Label>
    <span>
      <Timestamp date={LAST_REPORTED} variant="minutes" />
    </span>
    <Label>last connected</Label>
    <span>
      <Timestamp date={new Date('2026-07-29T23:47:00')} variant="minutes" />
    </span>
    <Label>device claimed</Label>
    <span>
      <Timestamp date={CLAIMED} variant="long" />
    </span>
    <Label>license expires</Label>
    <span>
      <Timestamp date={new Date('2027-01-01T00:00:00')} variant="short" />
    </span>
  </Grid>
)

/** `time` takes epoch milliseconds — what the API returns for session records. */
export const FromEpochMilliseconds = () => (
  <Grid>
    <Label>session start</Label>
    <span>
      <Timestamp time={1785499329000} variant="minutes" />
    </span>
    <Label>session end</Label>
    <span>
      <Timestamp time={1785503012000} variant="minutes" />
    </span>
    <Label>last heartbeat</Label>
    <span>
      <Timestamp time={1785503940000} variant="numeric" />
    </span>
    <Label>license renews</Label>
    <span>
      <Timestamp time={1798761600000} variant="long" />
    </span>
  </Grid>
)

/** Guards, as hit by a device that has never checked in: an unparseable date prints
    `-`, and a missing date — including `time={0}`, which is falsy — renders nothing. */
export const EmptyAndInvalid = () => (
  <Grid>
    <Label>claimed (valid)</Label>
    <span>
      <Timestamp date={CLAIMED} variant="short" />
    </span>
    <Label>unparseable date</Label>
    <span>
      <Timestamp date={new Date('not-a-date')} variant="short" />
    </span>
    <Label>lastReported missing</Label>
    <span style={{ opacity: 0.4 }}>
      <Timestamp />
      (renders nothing)
    </span>
    <Label>time=0</Label>
    <span style={{ opacity: 0.4 }}>
      <Timestamp time={0} variant="short" />
      (renders nothing)
    </span>
  </Grid>
)

/** How it reads in a device row, next to the status glyph. */
export const InDeviceRow = () => (
  <div style={{ display: 'grid', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name="circle-check" color="success" size="md" />
      <span style={{ minWidth: 150 }}>shop-floor-pi</span>
      <span style={{ opacity: 0.7 }}>
        <Timestamp date={LAST_REPORTED} variant="minutes" />
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name="circle" color="gray" size="md" />
      <span style={{ minWidth: 150 }}>warehouse-gateway</span>
      <span style={{ opacity: 0.7 }}>
        <Timestamp date={new Date('2026-07-18T06:31:00')} variant="minutes" />
      </span>
    </div>
  </div>
)
