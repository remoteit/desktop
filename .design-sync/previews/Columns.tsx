import React from 'react'
import { Columns, Icon } from 'remoteit-desktop-frontend'

const Page: React.FC<{ children?: React.ReactNode; width?: number }> = ({ children, width = 560 }) => (
  <div
    style={{
      width,
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 8,
      paddingTop: 4,
      paddingBottom: 4,
      color: '#2b2f38',
    }}
  >
    {children}
  </div>
)

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ padding: '8px 0' }}>
    <div style={{ fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.55 }}>{label}</div>
    <div style={{ fontSize: 14, marginTop: 2 }}>{value}</div>
  </div>
)

const Action: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 16,
      whiteSpace: 'nowrap',
      background: 'rgba(0,150,231,0.10)',
      color: '#0096e7',
      fontSize: 13,
    }}
  >
    <Icon name={icon} size="sm" color="primary" />
    {label}
  </div>
)

export const TwoColumn = () => (
  <Page>
    <Columns>
      <Field label="Service name" value="SSH — shop-floor-pi" />
      <Action icon="pen" label="Edit" />
    </Columns>
    <Columns>
      <Field label="Local port" value="33000" />
      <Action icon="copy" label="Copy" />
    </Columns>
    <Columns>
      <Field label="Target host" value="127.0.0.1:22" />
      <Action icon="radar" label="Scan" />
    </Columns>
  </Page>
)

export const SingleColumn = () => (
  <Page>
    <Columns count={1}>
      <Field label="Device" value="warehouse-gateway" />
      <Field label="Platform" value="Raspberry Pi OS (64-bit)" />
      <Field label="Last seen" value="2 minutes ago" />
    </Columns>
  </Page>
)

export const Inset = () => (
  <Page>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
      <Icon name="router" size="lg" color="primary" fixedWidth />
      <span style={{ fontSize: 15, fontWeight: 500 }}>edge-node-04</span>
    </div>
    <Columns inset>
      <Field label="Connection" value="Peer to peer · 24 ms" />
      <Action icon="circle-stop" label="Disconnect" />
    </Columns>
  </Page>
)

export const Centered = () => (
  <Page>
    <Columns center>
      <div
        style={{
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 6,
          padding: 12,
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 500, marginBottom: 6 }}>VNC</div>
        Stretches to the tallest column so both cards share a baseline height.
      </div>
      <div
        style={{
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 6,
          padding: 12,
          fontSize: 13,
          minWidth: 160,
        }}
      >
        <div style={{ fontWeight: 500, marginBottom: 6 }}>HTTP</div>
        Port 8080
      </div>
    </Columns>
  </Page>
)
