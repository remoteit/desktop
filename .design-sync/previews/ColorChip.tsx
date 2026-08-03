import React from 'react'
import { ColorChip, Icon } from 'remoteit-desktop-frontend'

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode; width?: number }> = ({
  label,
  children,
  width = 92,
}) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: width, padding: '0 6px' }}>
    {/* fixed height, not minHeight: a `medium` chip is taller than a `small` one, and
        letting the well grow pushes that cell's caption onto a different baseline. */}
    <div style={{ display: 'flex', alignItems: 'center', height: 36 }}>{children}</div>
    <span
      style={{ fontSize: 11, opacity: 0.55, fontFamily: 'system-ui', textAlign: 'center', whiteSpace: 'nowrap' }}
    >
      {label}
    </span>
  </div>
)

/** The three visual treatments, on the Remote.It brand blue. */
export const Variants = () => (
  <Row>
    {(['text', 'outlined', 'contained'] as const).map(variant => (
      <Cell key={variant} label={variant}>
        <ColorChip label="Connected" color="primary" variant={variant} size="small" />
      </Cell>
    ))}
  </Row>
)

/** Default `text` variant across the palette colors the app actually uses. */
export const PaletteText = () => (
  <Row>
    {(
      [
        ['primary', 'Connected'],
        ['calm', 'Idle'],
        ['success', 'Online'],
        ['warning', 'Degraded'],
        ['danger', 'Unreachable'],
        ['gray', 'Offline'],
        ['grayDarker', 'Unknown'],
      ] as const
    ).map(([color, label]) => (
      <Cell key={color} label={color}>
        <ColorChip label={label} color={color} size="small" />
      </Cell>
    ))}
  </Row>
)

/** `contained` fills with the palette color and flips the label to alwaysWhite. */
export const PaletteContained = () => (
  <Row>
    {(
      [
        ['primary', 'Licensed'],
        ['success', 'Active'],
        ['warning', 'Trial'],
        ['danger', 'Expired'],
        ['grayDarker', 'Archived'],
      ] as const
    ).map(([color, label]) => (
      <Cell key={color} label={color}>
        <ColorChip label={label} color={color} variant="contained" size="small" />
      </Cell>
    ))}
  </Row>
)

/** `outlined` keeps the label colored and drops the background fill. */
export const PaletteOutlined = () => (
  <Row>
    {(
      [
        ['primary', 'SSH'],
        ['success', 'VNC'],
        ['warning', 'HTTP'],
        ['danger', 'RDP'],
        ['grayDarker', 'TCP'],
      ] as const
    ).map(([color, label]) => (
      <Cell key={color} label={color}>
        <ColorChip label={label} color={color} variant="outlined" size="small" />
      </Cell>
    ))}
  </Row>
)

/** Chip sizes forwarded to MUI Chip. */
export const ChipSizes = () => (
  <Row>
    <Cell label="size=small">
      <ColorChip label="shop-floor-pi" color="primary" size="small" />
    </Cell>
    <Cell label="size=medium">
      <ColorChip label="shop-floor-pi" color="primary" size="medium" />
    </Cell>
    <Cell label="inline">
      <span style={{ fontFamily: 'system-ui', fontSize: 13 }}>
        Port
        <ColorChip label="33000" color="primary" size="small" inline />
        is bound
      </span>
    </Cell>
  </Row>
)

/** Role and tag chips as they appear on the organization members page. */
export const WithIconAndDelete = () => (
  <Row>
    <Cell label="icon">
      <ColorChip label="Owner" color="primary" variant="contained" size="small" icon={<Icon name="user-shield" size="xs" />} />
    </Cell>
    <Cell label="icon">
      <ColorChip label="Member" color="grayDarker" size="small" icon={<Icon name="user" size="xs" />} />
    </Cell>
    <Cell label="icon">
      <ColorChip label="Guest" color="warning" size="small" icon={<Icon name="user-slash" size="xs" />} />
    </Cell>
    <Cell label="onDelete">
      <ColorChip label="warehouse" color="success" size="small" onDelete={() => {}} />
    </Cell>
    <Cell label="onDelete + icon">
      <ColorChip label="raspberry-pi" color="primary" size="small" icon={<Icon name="tag" size="xs" />} onDelete={() => {}} />
    </Cell>
  </Row>
)
