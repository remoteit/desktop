import React from 'react'
import { LoadMore } from 'remoteit-desktop-frontend'

/* Plain HTML + inline styles only — importing @mui/material here would pull a
   second MUI instance into the preview bundle and the component would lose the
   app theme. LoadMore is absolutely positioned: it hangs off the bottom of the
   virtualized device / session list, so every cell gives it a relative parent
   with a few list rows above it for context. */

const Caption: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: 10, opacity: 0.6, fontFamily: 'system-ui', letterSpacing: 0.2 }}>{children}</span>
)

const DeviceRow: React.FC<{ name: string; service: string }> = ({ name, service }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 32,
      padding: '0 14px',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      fontFamily: 'system-ui',
    }}
  >
    <span style={{ width: 7, height: 7, borderRadius: 7, background: '#0096e7' }} />
    <span style={{ fontSize: 12.5 }}>{name}</span>
    <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 'auto' }}>{service}</span>
  </div>
)

/* The tail of a device list — LoadMore always sits directly under the last
   loaded row. */
const ListTail: React.FC<{ children?: React.ReactNode; caption: string }> = ({ children, caption }) => (
  <div style={{ display: 'grid', gap: 6 }}>
    <div style={{ width: 560 }}>
      <DeviceRow name="raspberrypi-lab" service="SSH · HTTP" />
      <DeviceRow name="nginx-edge" service="HTTP" />
      <DeviceRow name="workshop-nuc" service="VNC · SSH" />
      <div style={{ position: 'relative', height: 132 }}>{children}</div>
    </div>
    <Caption>{caption}</Caption>
  </div>
)

export const Idle = () => (
  <ListTail caption="fetching={false} — the resting affordance. The app theme paints every MuiButton grayDark, uppercase and letter-spaced, so Load More reads as a quiet list footer rather than a primary action">
    <LoadMore from={0} size={30} count={312} fetching={false} onLoadMore={() => {}} />
  </ListTail>
)

export const Fetching = () => (
  <ListTail caption="fetching={true} — the label becomes the range in flight (“Loading 30 - 60…”) and the button disables so the same page can't be requested twice">
    <LoadMore from={30} size={30} count={312} fetching={true} onLoadMore={() => {}} />
  </ListTail>
)

export const LargeSet = () => (
  <ListTail caption="the counts are locale-formatted — from=900 size=100 count=12480 shows “1,000 of 12,480” for an org-scale device list">
    <LoadMore from={900} size={100} count={12480} fetching={false} onLoadMore={() => {}} />
  </ListTail>
)

export const LastPageHidden = () => (
  <ListTail caption="from=300 size=30 count=312 is the final page, so nextPage >= pages and the component returns null — the list tail is intentionally empty here">
    <div style={{ position: 'absolute', left: 36, top: 44, fontSize: 11.5, opacity: 0.55, fontFamily: 'system-ui' }}>
      (renders nothing — 312 of 312 devices already loaded)
    </div>
    <LoadMore from={300} size={30} count={312} fetching={false} onLoadMore={() => {}} />
  </ListTail>
)
