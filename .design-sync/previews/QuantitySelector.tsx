import React from 'react'
import { QuantitySelector } from 'remoteit-desktop-frontend'

const Row: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      maxWidth: 420,
      padding: '4px 0',
    }}
  >
    <span style={{ fontSize: 14 }}>{label}</span>
    {children}
  </div>
)

export const Basic = () => (
  <div>
    <Row label="Business licenses">
      <QuantitySelector quantity={5} onChange={() => {}} />
    </Row>
    <Row label="Enterprise licenses">
      <QuantitySelector quantity={25} onChange={() => {}} />
    </Row>
  </div>
)

export const ValueRange = () => (
  <div>
    <Row label="Seats (minimum)">
      <QuantitySelector quantity={1} onChange={() => {}} />
    </Row>
    <Row label="Seats (typical)">
      <QuantitySelector quantity={12} onChange={() => {}} />
    </Row>
    <Row label="Seats (fleet)">
      <QuantitySelector quantity={1200} onChange={() => {}} />
    </Row>
  </div>
)

export const InCheckout = () => (
  <div style={{ maxWidth: 420 }}>
    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Remote.It Business</div>
    <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 12 }}>$15 per device, per month</div>
    <Row label="Devices">
      <QuantitySelector quantity={40} onChange={() => {}} />
    </Row>
    <div style={{ fontSize: 13, opacity: 0.65, marginTop: 12 }}>Billed annually — $7,200 / year</div>
  </div>
)
