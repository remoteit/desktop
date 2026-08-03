import React from 'react'
import { LicensingIcon } from 'remoteit-desktop-frontend'

/**
 * LicensingIcon brands a license row with the mark of the product the license
 * came from. It switches on `license.id` — the product id, not the license id —
 * and the remote.it product (plus anything unrecognised) renders the R3 mark,
 * which is an inline SVG filled with `currentColor`.
 */

const REMOTEIT_PRODUCT_ID = 'b999e047-5532-11eb-8872-063ce187bcd7'
const RESELLER_PRODUCT_ID = '2c1e2b04-7a1e-4d0e-9a8b-6f31f0c4b5aa'

const license = (id: string, over: Record<string, any> = {}): any => ({
  id,
  created: new Date('2024-01-14T00:00:00Z'),
  updated: new Date('2024-10-01T00:00:00Z'),
  expiration: new Date('2025-01-14T00:00:00Z'),
  valid: true,
  quantity: 25,
  custom: false,
  plan: { id: 'plan-business', name: 'BUSINESS', description: 'Business', commercial: true, billing: true },
  ...over,
})

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode; width?: number; background?: string }> = ({
  label,
  children,
  width = 128,
  background = '#f0f2f4',
}) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 7, width }}>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
    <span
      style={{
        fontSize: 11,
        lineHeight: 1.35,
        opacity: 0.55,
        fontFamily: 'system-ui',
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
    >
      {label}
    </span>
  </div>
)

/**
 * The `license.id` → mark mapping, read as a table rather than a variant sweep:
 * the remote.it product id and every unrecognised product id both resolve to
 * the R3 mark, because the switch has no per-vendor fallback. The other
 * license fields (valid, custom, quantity) are deliberately ignored.
 */
export const ProductIdMapping = () => {
  const rows: [string, string, any][] = [
    ['b999e047-…-063ce187bcd7', 'REMOTEIT_PRODUCT_ID → R3 mark', license(REMOTEIT_PRODUCT_ID)],
    ['2c1e2b04-…-6f31f0c4b5aa', 'reseller product id → default branch → R3 mark', license(RESELLER_PRODUCT_ID)],
    [
      'b999e047-…-063ce187bcd7',
      'valid=false, custom=true — mark is unchanged',
      license(REMOTEIT_PRODUCT_ID, { valid: false, custom: true, quantity: 250 }),
    ],
  ]
  return (
    <div style={{ display: 'grid', gap: 10, fontFamily: 'system-ui', width: 420 }}>
      {rows.map(([id, note, lic], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <code style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', opacity: 0.7, width: 168 }}>{id}</code>
          <span style={{ fontSize: 12, opacity: 0.4 }}>→</span>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f0f2f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LicensingIcon license={lic} />
          </span>
          <span style={{ fontSize: 11, opacity: 0.55, flex: 1 }}>{note}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * The mark is drawn with `fill: currentColor`, so it takes the text color of
 * whatever row it sits in — muted in a table, brand blue in a header, white on
 * a filled banner.
 */
export const InheritedColor = () => (
  <Row>
    <Cell label="inherits body text color">
      <span style={{ display: 'inline-flex' }}>
        <LicensingIcon license={license(REMOTEIT_PRODUCT_ID)} />
      </span>
    </Cell>
    <Cell label="color: #0096e7 (brand)">
      <span style={{ display: 'inline-flex', color: '#0096e7' }}>
        <LicensingIcon license={license(REMOTEIT_PRODUCT_ID)} />
      </span>
    </Cell>
    <Cell label="color: gray · muted row">
      <span style={{ display: 'inline-flex', color: '#8c8c8c' }}>
        <LicensingIcon license={license(REMOTEIT_PRODUCT_ID)} />
      </span>
    </Cell>
    <Cell label="white on brand banner" background="#0096e7">
      <span style={{ display: 'inline-flex', color: '#ffffff' }}>
        <LicensingIcon license={license(REMOTEIT_PRODUCT_ID)} />
      </span>
    </Cell>
  </Row>
)

/** In context: the Licensing page, one row per license on the account. */
export const InLicensingList = () => {
  const rows: [any, string, string][] = [
    [license(REMOTEIT_PRODUCT_ID), 'remote.it Business', '25 seats · renews Jan 14, 2025'],
    [license(REMOTEIT_PRODUCT_ID, { custom: true, quantity: 250 }), 'remote.it Enterprise', '250 seats · custom terms'],
    [license(RESELLER_PRODUCT_ID, { quantity: 5 }), 'Reseller bundle', '5 seats · managed by partner'],
  ]
  return (
    <div style={{ width: 380, fontFamily: 'system-ui' }}>
      {rows.map(([lic, name, detail], i) => (
        <div
          key={name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '10px 4px',
            borderBottom: i === rows.length - 1 ? 'none' : '1px solid #eceef0',
          }}
        >
          <span style={{ display: 'flex', width: 24, justifyContent: 'center', color: '#0096e7' }}>
            <LicensingIcon license={lic} />
          </span>
          <span style={{ display: 'grid', flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
            <span style={{ fontSize: 11, opacity: 0.55 }}>{detail}</span>
          </span>
          <span style={{ fontSize: 11, color: '#0096e7' }}>Active</span>
        </div>
      ))}
    </div>
  )
}

/** In context: the plan header on the account overview. */
export const InPlanHeader = () => (
  <div
    style={{
      width: 300,
      fontFamily: 'system-ui',
      border: '1px solid #e4e7ea',
      borderRadius: 8,
      padding: 16,
      display: 'grid',
      gap: 10,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#0096e7' }}>
      <LicensingIcon license={license(REMOTEIT_PRODUCT_ID)} />
      <span style={{ fontSize: 15, fontWeight: 600 }}>Business</span>
    </div>
    <div style={{ fontSize: 12, opacity: 0.6 }}>25 of 25 seats assigned</div>
    <div style={{ fontSize: 12, opacity: 0.6 }}>Renews January 14, 2025</div>
  </div>
)
