import React from 'react'
import { ProductStatusChip } from 'remoteit-desktop-frontend'

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>{children}</div>
)

const Cell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'grid', justifyItems: 'center', gap: 6, minWidth: 104 }}>
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 28 }}>{children}</div>
    <span style={{ fontSize: 11, opacity: 0.55, fontFamily: 'system-ui', textAlign: 'center' }}>{label}</span>
  </div>
)

/** The two IDeviceProduct statuses. LOCKED is published & immutable; NEW is a draft. */
export const Statuses = () => (
  <Row>
    <Cell label="status='NEW' → Draft">
      <ProductStatusChip status="NEW" />
    </Cell>
    <Cell label="status='LOCKED' → Locked">
      <ProductStatusChip status="LOCKED" />
    </Cell>
  </Row>
)

/** `undefined` is treated as not-locked, so it renders the Draft chip. */
export const UndefinedStatus = () => (
  <Row>
    <Cell label="status={undefined}">
      <ProductStatusChip />
    </Cell>
    <Cell label="status='NEW'">
      <ProductStatusChip status="NEW" />
    </Cell>
    <Cell label="status='LOCKED'">
      <ProductStatusChip status="LOCKED" />
    </Cell>
  </Row>
)

/** Size is forwarded through ColorChip to MUI Chip; small is the default. */
export const ChipSizes = () => (
  <Row>
    <Cell label="NEW · small">
      <ProductStatusChip status="NEW" size="small" />
    </Cell>
    <Cell label="NEW · medium">
      <ProductStatusChip status="NEW" size="medium" />
    </Cell>
    <Cell label="LOCKED · small">
      <ProductStatusChip status="LOCKED" size="small" />
    </Cell>
    <Cell label="LOCKED · medium">
      <ProductStatusChip status="LOCKED" size="medium" />
    </Cell>
  </Row>
)

/** How the chip reads down the products list. */
export const InProductList = () => (
  <div style={{ display: 'grid', minWidth: 380, maxWidth: 440 }}>
    {(
      [
        ['Warehouse Gateway v2', 'LOCKED'],
        ['Shop Floor Pi — SSH bundle', 'LOCKED'],
        ['Cold Storage Sensor', 'NEW'],
        ['Field Router (Ubuntu)', 'NEW'],
      ] as const
    ).map(([name, status]) => (
      <div
        key={name}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          padding: '7px 0',
          fontFamily: 'system-ui',
          fontSize: 13,
        }}
      >
        <span>{name}</span>
        <ProductStatusChip status={status} />
      </div>
    ))}
  </div>
)
