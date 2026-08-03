import React from 'react'
import { SessionsTooltip, Icon } from 'remoteit-desktop-frontend'

// SessionsTooltip lists who is currently connected to a service. It takes an
// `open` prop, so these cells render it pinned open — a hover-only tooltip
// can't be screenshotted otherwise. It returns null without a `service`.
const service = (name: string): any => ({
  id: '80:00:00:00:01:0A:BC:DE',
  name,
  state: 'active',
  typeID: 28,
  deviceID: '80:00:00:00:01:0A:BC:00',
})

const session = (email: string): any => ({
  id: `session-${email}`,
  timestamp: new Date('2026-08-03T15:04:00Z'),
  platform: 1,
  user: { id: email, email },
})

// The anchor the tooltip attaches to — in the app this is the service row's
// active-users glyph.
const Anchor: React.FC<{ count: number }> = ({ count }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 4,
      fontSize: 13,
      border: '1px solid rgba(0,0,0,0.12)',
    }}
  >
    <Icon name="user" color="primary" size="sm" />
    {count} connected
  </span>
)

// Tooltips render into a portal anchored to the trigger, so each cell needs
// room around the anchor for the bubble to land in.
const Stage: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 150,
      minWidth: 320,
      padding: 24,
    }}
  >
    {children}
  </div>
)

export const ActiveUsers = () => (
  <Stage>
    <SessionsTooltip
      open
      arrow
      placement="right"
      service={service('SSH')}
      sessions={[session('dana.li@remote.it'), session('marcus.webb@remote.it')]}
    >
      <Anchor count={2} />
    </SessionsTooltip>
  </Stage>
)

export const WithServiceLabel = () => (
  <Stage>
    <SessionsTooltip
      open
      arrow
      label
      placement="right"
      service={service('VNC on 5900')}
      sessions={[session('dana.li@remote.it'), session('ops@northwind-logistics.com')]}
    >
      <Anchor count={2} />
    </SessionsTooltip>
  </Stage>
)

export const OverflowAndCaption = () => (
  <Stage>
    <SessionsTooltip
      open
      arrow
      label
      secondaryLabel="Connected now"
      placement="right"
      service={service('HTTP on 80')}
      sessions={[
        session('dana.li@remote.it'),
        session('marcus.webb@remote.it'),
        session('ops@northwind-logistics.com'),
        session('field.tech@northwind-logistics.com'),
        session('contractor@acme-integrators.com'),
      ]}
    >
      <Anchor count={5} />
    </SessionsTooltip>
  </Stage>
)

export const SingleSession = () => (
  <Stage>
    {/* The common case on a device page: one engineer holding the SSH session. */}
    <SessionsTooltip
      open
      arrow
      label
      placement="right"
      service={service('SSH on 22')}
      sessions={[session('dana.li@remote.it')]}
    >
      <Anchor count={1} />
    </SessionsTooltip>
  </Stage>
)
