import React from 'react'
import { Avatar } from 'remoteit-desktop-frontend'

/* Plain-HTML layout only — importing @mui/material here would bundle a second
   MUI instance whose ThemeProvider context differs from the DS bundle's. */
const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 8, minWidth: 64 }}>
    {children}
    <span style={{ fontSize: 10, opacity: 0.6 }}>{label}</span>
  </div>
)

/** Members of a Remote.It organization — the color is hashed off the email. */
export const OrganizationMembers = () => (
  <Row>
    {[
      'dana.reyes@remote.it',
      'ops@northfield-robotics.com',
      'field.tech@remote.it',
      'kenji.sato@remote.it',
      'billing@northfield-robotics.com',
    ].map(email => (
      <Avatar key={email} email={email} size={40} />
    ))}
  </Row>
)

export const Sizes = () => (
  <Row>
    {[20, 28, 36, 48, 64].map(size => (
      <Cell key={size} label={`${size}px`}>
        <Avatar email="dana.reyes@remote.it" size={size} />
      </Cell>
    ))}
  </Row>
)

/** `button` renders the clickable account-menu ring; `active` lights it primary. */
export const AccountButton = () => (
  <Row>
    <Cell label="button">
      <Avatar email="dana.reyes@remote.it" size={36} button />
    </Cell>
    <Cell label="button active">
      <Avatar email="dana.reyes@remote.it" size={36} button active />
    </Cell>
    <Cell label="border 3">
      <Avatar email="ops@northfield-robotics.com" size={36} border={3} />
    </Cell>
  </Row>
)

/** `fallback` overrides the initial when there is no email — e.g. a shared device. */
export const Fallbacks = () => (
  <Row>
    <Cell label="no email">
      <Avatar size={40} />
    </Cell>
    <Cell label="fallback S">
      <Avatar size={40} fallback="shop-floor-pi" />
    </Cell>
    <Cell label="fallback W">
      <Avatar size={40} fallback="warehouse-gateway" />
    </Cell>
  </Row>
)

/** `inline` adds trailing spacing so the avatar sits in a line of text. */
export const InlineWithLabel = () => (
  <div style={{ display: 'grid', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Avatar email="dana.reyes@remote.it" size={24} inline />
      <span>dana.reyes@remote.it shared shop-floor-pi &mdash; SSH</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Avatar email="field.tech@remote.it" size={24} inline />
      <span>field.tech@remote.it connected to warehouse-gateway:33000</span>
    </div>
  </div>
)
