import React from 'react'
import { Icon } from 'remoteit-desktop-frontend'

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: 56 }}>
    {children}
    <span style={{ fontSize: 10, opacity: 0.6, fontFamily: 'system-ui' }}>{label}</span>
  </div>
)

export const Sizes = () => (
  <Row>
    {(['xxs', 'xs', 'sm', 'base', 'md', 'lg', 'xl', 'xxl'] as const).map(size => (
      <Cell key={size} label={size}>
        <Icon name="wifi" size={size} />
      </Cell>
    ))}
  </Row>
)

export const Weights = () => (
  <Row>
    {(['light', 'regular', 'solid'] as const).map(type => (
      <Cell key={type} label={type}>
        <Icon name="shield" type={type} size="xl" />
      </Cell>
    ))}
    {/* `brands` is a separate family, not a weight — it only resolves for
        brand names (docker, apple…), never for a UI glyph like `shield`. */}
    <Cell label="brands">
      <Icon name="docker" type="brands" size="xl" />
    </Cell>
  </Row>
)

export const Colors = () => (
  <Row>
    {(['primary', 'success', 'warning', 'danger', 'gray', 'grayDarker'] as const).map(color => (
      <Cell key={color} label={color}>
        <Icon name="circle-check" color={color} size="xl" />
      </Cell>
    ))}
  </Row>
)

export const ProductIcons = () => (
  <Row>
    {['server', 'network-wired', 'router', 'laptop', 'mobile', 'globe', 'lock', 'key', 'bolt', 'plug'].map(
      name => (
        <Cell key={name} label={name}>
          <Icon name={name} size="lg" />
        </Cell>
      )
    )}
  </Row>
)

export const Platforms = () => (
  <Row>
    {['apple', 'android', 'ubuntu', 'docker', 'raspberry-pi', 'usb', 'bluetooth'].map(name => (
      <Cell key={name} label={name}>
        <Icon name={name} type="brands" size="lg" />
      </Cell>
    ))}
  </Row>
)

export const Spinning = () => (
  <Row>
    <Cell label="spin">
      <Icon name="rotate" size="xl" spin />
    </Cell>
    <Cell label="fixedWidth">
      <Icon name="bolt" size="xl" fixedWidth />
    </Cell>
    <Cell label="rotate 90">
      <Icon name="arrow-right" size="xl" rotate={90} />
    </Cell>
  </Row>
)
