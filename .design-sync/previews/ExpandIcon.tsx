import React from 'react'
import { ExpandIcon } from 'remoteit-desktop-frontend'

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: 76 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 26 }}>{children}</div>
    <span style={{ fontSize: 11, opacity: 0.55, fontFamily: 'system-ui', textAlign: 'center' }}>{label}</span>
  </div>
)

/** The caret animates between -90deg (collapsed) and 0deg (expanded). */
export const OpenState = () => (
  <Row>
    <Cell label="open={false} · -90°">
      <ExpandIcon open={false} />
    </Cell>
    <Cell label="open={true} · 0°">
      <ExpandIcon open />
    </Cell>
    <Cell label="open={undefined}">
      <ExpandIcon />
    </Cell>
  </Row>
)

/** Palette colors — grayDarker is the default; primary marks an active group. */
export const Colors = () => (
  <Row>
    {(['grayDarker', 'primary', 'gray', 'grayLight', 'success', 'warning', 'danger'] as const).map(color => (
      <Cell key={color} label={color}>
        <ExpandIcon open color={color} />
      </Cell>
    ))}
  </Row>
)

/** Size ramp — `sm` is the default used in list rows. */
export const Sizes = () => (
  <Row>
    {(['xxs', 'xs', 'sm', 'base', 'md', 'lg', 'xl'] as const).map(size => (
      <Cell key={size} label={size}>
        <ExpandIcon open size={size} />
      </Cell>
    ))}
  </Row>
)

/** Its real home: collapsible device-group headers in the sidebar. */
export const InGroupHeaders = () => (
  <div style={{ display: 'grid', minWidth: 320, maxWidth: 380 }}>
    {(
      [
        ['Warehouse', 12, true],
        ['Shop Floor', 4, false],
        ['Field Routers', 27, false],
        ['Lab (Raspberry Pi)', 6, true],
      ] as const
    ).map(([name, count, open]) => (
      <div
        key={name}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '7px 0',
          fontFamily: 'system-ui',
          fontSize: 13,
        }}
      >
        <ExpandIcon open={open} />
        <span style={{ flex: 1, marginLeft: 4 }}>{name}</span>
        <span style={{ opacity: 0.5 }}>{count}</span>
      </div>
    ))}
  </div>
)
