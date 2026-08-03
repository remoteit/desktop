import React from 'react'
import { ArrowIcon } from 'remoteit-desktop-frontend'

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: 80 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 26 }}>{children}</div>
    <span style={{ fontSize: 11, opacity: 0.55, fontFamily: 'system-ui', textAlign: 'center' }}>{label}</span>
  </div>
)

/**
 * Defaults are solid `angle-down` at size `sm`. The `type` axis only changes
 * stroke weight, so it is swept at `lg` where the difference is readable.
 */
export const Default = () => (
  <Row>
    <Cell label="<ArrowIcon /> — sm, solid">
      <ArrowIcon />
    </Cell>
    <Cell label="fixedWidth — sm">
      <ArrowIcon fixedWidth />
    </Cell>
    <Cell label="type='solid' (default) — lg">
      <ArrowIcon type="solid" size="lg" />
    </Cell>
    <Cell label="type='regular' — lg">
      <ArrowIcon type="regular" size="lg" />
    </Cell>
    <Cell label="type='light' — lg">
      <ArrowIcon type="light" size="lg" />
    </Cell>
  </Row>
)

/** `rotate` re-points the arrow — how menus and sort headers reuse it. */
export const Directions = () => (
  <Row>
    {(
      [
        [0, 'rotate=0 · down'],
        [-90, 'rotate=-90 · right'],
        [90, 'rotate=90 · left'],
        [180, 'rotate=180 · up'],
        [-45, 'rotate=-45 · launch'],
      ] as const
    ).map(([rotate, label]) => (
      <Cell key={label} label={label}>
        <ArrowIcon rotate={rotate} size="md" />
      </Cell>
    ))}
  </Row>
)

/** Palette colors resolved from the app theme. */
export const Colors = () => (
  <Row>
    {(['primary', 'success', 'warning', 'danger', 'gray', 'grayDark', 'grayDarker'] as const).map(color => (
      <Cell key={color} label={color}>
        <ArrowIcon color={color} size="md" />
      </Cell>
    ))}
  </Row>
)

/** Size ramp — `sm` is the default. */
export const Sizes = () => (
  <Row>
    {(['xxs', 'xs', 'sm', 'base', 'md', 'lg', 'xl'] as const).map(size => (
      <Cell key={size} label={size}>
        <ArrowIcon size={size} />
      </Cell>
    ))}
  </Row>
)

/** `name` passes straight through to Icon, so any glyph can stand in. */
export const NameOverrides = () => (
  <Row>
    {['angle-down', 'angle-left', 'angle-right', 'chevron-down', 'caret-down', 'arrow-down', 'arrow-right'].map(
      name => (
        <Cell key={name} label={name}>
          <ArrowIcon name={name} size="md" />
        </Cell>
      )
    )}
  </Row>
)

/** In context: sortable column headers on the device list. */
export const InSortHeaders = () => (
  <div style={{ display: 'grid', minWidth: 300, maxWidth: 360 }}>
    {(
      [
        ['Device name', 0],
        ['Last reported', 180],
        ['Owner', 0],
      ] as const
    ).map(([label, rotate]) => (
      <div
        key={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 0',
          fontFamily: 'system-ui',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <span>{label}</span>
        <ArrowIcon rotate={rotate} color="primary" />
      </div>
    ))}
  </div>
)
