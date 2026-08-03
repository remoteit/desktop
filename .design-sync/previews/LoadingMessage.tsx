import React from 'react'
import { LoadingMessage, Icon } from 'remoteit-desktop-frontend'

// LoadingMessage picks its container from `inline`: inline → Gutters (drops into
// a page), otherwise → Body (fills the scroll area). The Body variant needs a
// sized parent to show, so the full-screen cells give it one.
const Frame: React.FC<{ children?: React.ReactNode; height?: number }> = ({ children, height = 220 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 520, height }}>{children}</div>
)

export const Inline = () => (
  <div style={{ maxWidth: 520 }}>
    <LoadingMessage inline message="Loading devices…" />
  </div>
)

export const WithLogo = () => (
  <Frame height={260}>
    <LoadingMessage
      logo={<Icon name="chart-network" color="primary" fontSize={64} />}
      message="Connecting to Remote.It Cloud…"
    />
  </Frame>
)

export const NoSpinner = () => (
  <div style={{ maxWidth: 520 }}>
    <LoadingMessage inline spinner={false} message="No sessions in the last 30 days." />
  </div>
)

export const WithChildren = () => (
  <Frame height={280}>
    <LoadingMessage message="Scanning the local network for devices…">
      <span style={{ fontSize: 12, opacity: 0.6 }}>Found 4 of 12 hosts · 192.168.1.0/24</span>
    </LoadingMessage>
  </Frame>
)

export const Inverted = () => (
  <Frame height={260}>
    <LoadingMessage
      invert
      logo={<Icon name="cloud" color="alwaysWhite" fontSize={56} />}
      message="Signing in to Remote.It…"
    />
  </Frame>
)
