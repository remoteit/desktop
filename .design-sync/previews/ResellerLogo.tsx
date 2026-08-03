import React from 'react'
import { ResellerLogo } from 'remoteit-desktop-frontend'

// ResellerLogo measures the real image and scales it to a fixed AREA (2400px²
// small, 6400px² medium) so logos of different aspect ratios read at the same
// visual weight. It renders null until that measurement resolves, so the logo
// has to actually load — these cells inline the artwork as a data URI rather
// than depend on the network during capture.
const svg = (body: string, w: number, h: number) =>
  'data:image/svg+xml;base64,' +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
  )

const wide = svg(
  `<rect width="320" height="80" fill="#0096e7"/>
   <circle cx="46" cy="40" r="18" fill="#ffffff"/>
   <text x="80" y="48" font-family="Helvetica,Arial,sans-serif" font-size="26" font-weight="700" fill="#ffffff">NORTHWIND</text>
   <text x="80" y="66" font-family="Helvetica,Arial,sans-serif" font-size="12" letter-spacing="4" fill="#bde5fb">LOGISTICS</text>`,
  320,
  80
)

const square = svg(
  `<rect width="160" height="160" rx="24" fill="#1c2033"/>
   <path d="M40 112 L80 44 L120 112 Z" fill="#0096e7"/>
   <text x="80" y="140" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="20" font-weight="700" fill="#ffffff">ACME</text>`,
  160,
  160
)

const portrait = svg(
  `<rect width="90" height="220" rx="12" fill="#0d1b2a"/>
   <rect x="30" y="26" width="30" height="30" rx="6" fill="#0096e7"/>
   <rect x="30" y="66" width="30" height="30" rx="6" fill="#63BD87"/>
   <rect x="30" y="106" width="30" height="30" rx="6" fill="#0096e7"/>
   <text x="45" y="172" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="17" font-weight="700" fill="#ffffff">CASCADE</text>
   <text x="45" y="194" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" letter-spacing="2" fill="#7fa6c0">CONTROLS</text>`,
  90,
  220
)

const reseller = (name: string, logoUrl: string): any => ({
  name,
  email: `billing@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
  logoUrl,
})

const Frame: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', minHeight: 120 }}>{children}</div>
)

export const Medium = () => (
  <Frame>
    <ResellerLogo reseller={reseller('Northwind Logistics', wide)} />
  </Frame>
)

export const Small = () => (
  <Frame>
    <ResellerLogo reseller={reseller('Northwind Logistics', wide)} size="small" />
  </Frame>
)

export const SquareMark = () => (
  <Frame>
    {/* Same target area, very different aspect ratio — the point of the
        area-based sizing. */}
    <ResellerLogo reseller={reseller('Acme Integrators', square)} />
  </Frame>
)

export const WithCaption = () => (
  <div style={{ maxWidth: 380 }}>
    <ResellerLogo reseller={reseller('Northwind Logistics', wide)}>
      <div style={{ fontSize: 13, opacity: 0.7, paddingLeft: 24 }}>
        Your Remote.It plan is billed through Northwind Logistics. Contact
        billing@northwindlogistics.com to change seats.
      </div>
    </ResellerLogo>
  </div>
)

export const PortraitMark = () => (
  <Frame>
    {/* The opposite aspect extreme from `Medium`: a tall mark normalized to the
        same 6400px² so it never towers over the wide lockups. */}
    <ResellerLogo reseller={reseller('Cascade Controls', portrait)} />
  </Frame>
)
