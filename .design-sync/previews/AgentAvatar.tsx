import React from 'react'
import { AgentAvatar } from 'remoteit-desktop-frontend'

// AgentAvatar renders an authorized OAuth client's logo_uri, falling back to a
// colored monogram seeded from the client name (the same seeded-color scheme as
// user avatars). No per-app code — anything that registers a logo_uri shows up.
const logo = (body: string) =>
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${body}</svg>`)

const claudeLogo = logo(
  `<rect width="96" height="96" fill="#d97757"/>
   <text x="48" y="66" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="52" font-weight="700" fill="#ffffff">C</text>`
)

const agent = (over: any = {}): any => ({
  clientId: 'a1f4c8e2-3b7d-4c19-9f0a-2d6e8b5c1074',
  clientName: 'Claude Desktop',
  logoUri: null,
  reach: null,
  lastActive: '2026-08-03T14:12:00Z',
  scopes: ['device:read', 'device:connect'],
  ...over,
})

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 8, minWidth: 96 }}>
    {children}
    <span style={{ fontSize: 11, opacity: 0.6 }}>{label}</span>
  </div>
)

export const Monograms = () => (
  <Row>
    <Cell label="Claude Desktop">
      <AgentAvatar agent={agent()} size={40} />
    </Cell>
    <Cell label="Cursor">
      <AgentAvatar agent={agent({ clientName: 'Cursor' })} size={40} />
    </Cell>
    <Cell label="Home Assistant">
      <AgentAvatar agent={agent({ clientName: 'Home Assistant' })} size={40} />
    </Cell>
    <Cell label="Zapier">
      <AgentAvatar agent={agent({ clientName: 'Zapier' })} size={40} />
    </Cell>
    <Cell label="Fleet Provisioner">
      <AgentAvatar agent={agent({ clientName: 'Fleet Provisioner' })} size={40} />
    </Cell>
  </Row>
)

export const WithLogo = () => (
  <Row>
    <Cell label="logo_uri registered">
      <AgentAvatar agent={agent({ logoUri: claudeLogo })} size={48} />
    </Cell>
    <Cell label="no logo_uri">
      <AgentAvatar agent={agent()} size={48} />
    </Cell>
    <Cell label="unnamed client">
      <AgentAvatar agent={agent({ clientName: undefined })} size={48} />
    </Cell>
  </Row>
)

export const Sizes = () => (
  <Row>
    {[16, 24, 32, 40, 56].map(size => (
      <Cell key={size} label={`${size}px`}>
        <AgentAvatar agent={agent({ clientName: 'Home Assistant' })} size={size} />
      </Cell>
    ))}
  </Row>
)

export const Inline = () => (
  <div style={{ display: 'grid', gap: 10, fontSize: 14, maxWidth: 460 }}>
    <div>
      <AgentAvatar agent={agent({ logoUri: claudeLogo })} size={20} inline />
      Claude Desktop connected to shop-floor-pi
    </div>
    <div>
      <AgentAvatar agent={agent({ clientName: 'Home Assistant' })} size={20} inline />
      Home Assistant opened SSH on warehouse-gateway
    </div>
    <div>
      <AgentAvatar agent={agent({ clientName: 'Fleet Provisioner' })} size={20} inline />
      Fleet Provisioner registered 12 devices
    </div>
  </div>
)
