import React from 'react'
import { LicenseChip } from 'remoteit-desktop-frontend'

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: 96 }}>
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 26 }}>{children}</div>
    <span style={{ fontSize: 11, opacity: 0.55, fontFamily: 'system-ui', textAlign: 'center' }}>{label}</span>
  </div>
)

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  padding: '6px 0',
  fontFamily: 'system-ui',
  fontSize: 13,
}

/** Every key in the licenseChipLookup table, in the order the app defines them. */
export const AllLicenseStates = () => (
  <Row>
    {(['LICENSED', 'EVALUATION', 'UNLICENSED', 'NON_COMMERCIAL', 'LEGACY', 'EXEMPT', 'UNKNOWN'] as const).map(
      license => (
        <Cell key={license} label={license}>
          <LicenseChip license={license} />
        </Cell>
      )
    )}
  </Row>
)

/**
 * The two states flagged `show: true` in the lookup — these are the only ones
 * the device list surfaces inline, because they need the user to act.
 */
export const AttentionStates = () => (
  <Row>
    <Cell label="EVALUATION — warningHighlight">
      <LicenseChip license="EVALUATION" />
    </Cell>
    <Cell label="UNLICENSED — warningHighlight">
      <LicenseChip license="UNLICENSED" />
    </Cell>
    <Cell label="LICENSED — brand blue">
      <LicenseChip license="LICENSED" />
    </Cell>
  </Row>
)

/**
 * Anything unmapped (including `undefined`) falls through to the Unknown chip —
 * the three left cells are meant to look alike. `LICENSED` is shown last so the
 * fallback is legible as a fallback and not as a rendering failure.
 */
export const UnknownFallback = () => (
  <Row>
    <Cell label="license={undefined} → Unknown">
      <LicenseChip />
    </Cell>
    <Cell label="license='PENDING' (unmapped) → Unknown">
      <LicenseChip license="PENDING" />
    </Cell>
    <Cell label="license='UNKNOWN' → Unknown">
      <LicenseChip license="UNKNOWN" />
    </Cell>
    <Cell label="license='LICENSED' (mapped, for contrast)">
      <LicenseChip license="LICENSED" />
    </Cell>
  </Row>
)

/** As it appears against each seat on the organization members page. */
export const InMemberList = () => (
  <div style={{ display: 'grid', minWidth: 380, maxWidth: 460 }}>
    {(
      [
        ['dana@remote.it', 'LICENSED'],
        ['ops@warehouse-gateway.io', 'EVALUATION'],
        ['contractor@shopfloor.example', 'UNLICENSED'],
        ['research@university.edu', 'NON_COMMERCIAL'],
        ['legacy-admin@remote.it', 'LEGACY'],
      ] as const
    ).map(([email, license]) => (
      <div key={email} style={rowStyle}>
        <span>{email}</span>
        <LicenseChip license={license} />
      </div>
    ))}
  </div>
)
