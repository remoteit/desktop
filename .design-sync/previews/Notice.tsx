import React from 'react'
import { Notice } from 'remoteit-desktop-frontend'

const Stack: React.FC<{ children?: React.ReactNode; width?: number }> = ({ children, width = 520 }) => (
  <div style={{ display: 'grid', gap: 12, maxWidth: width }}>{children}</div>
)

export const Severities = () => (
  <Stack>
    <Notice severity="info">Your device is connected and reachable.</Notice>
    <Notice severity="success">Connection established on port 33000.</Notice>
    <Notice severity="warning">This device hasn’t checked in for 6 days.</Notice>
    <Notice severity="error">Unable to reach the target service.</Notice>
  </Stack>
)

export const Solid = () => (
  <Stack>
    <Notice severity="info" solid>
      Scheduled maintenance on Sunday at 02:00 UTC.
    </Notice>
    <Notice severity="warning" solid>
      Your trial ends in 3 days.
    </Notice>
    <Notice severity="error" solid>
      Billing failed — update your payment method.
    </Notice>
  </Stack>
)

export const WithButton = () => (
  <Stack>
    <Notice
      severity="warning"
      button={
        <a href="#" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
          Upgrade
        </a>
      }
    >
      You’ve reached the device limit on the Personal plan.
    </Notice>
    <Notice severity="info" onClose={() => {}} closeTitle="Dismiss">
      Remote.It Desktop 3.47 is available.
    </Notice>
  </Stack>
)

export const LongForm = () => (
  <Stack>
    <Notice severity="info" gutterTop gutterBottom>
      A jump service lets you reach devices on a remote network without installing Remote.It on
      each one. Traffic is routed through the jump device over an outbound-only connection, so no
      inbound ports need to be opened on either network.
    </Notice>
  </Stack>
)
