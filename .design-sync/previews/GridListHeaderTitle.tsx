import React from 'react'
import { GridListHeaderTitle, Gutters, Icon } from 'remoteit-desktop-frontend'

/**
 * The app passes `Attribute` class instances; Attribute isn't exported from the
 * design-system entry, so these are structurally-identical plain objects —
 * GridListHeaderTitle only reads `id`, `label`, `align` and calls `width()`.
 */
const attr = (id: string, label: string, defaultWidth: number, align?: 'left' | 'right' | 'center') => ({
  id,
  label,
  align,
  defaultWidth,
  required: false,
  width: (columnWidths: { [key: string]: number }) => columnWidths[id] || defaultWidth,
})

const noop = () => {}

/** Mirrors the GridList header row: white, one-line, small gray type. */
const HeaderRow: React.FC<{ children?: React.ReactNode; template: string; width?: number }> = ({
  children,
  template,
  width = 660,
}) => (
  <Gutters
    size={null}
    top={null}
    bottom={null}
    sx={{
      width,
      display: 'grid',
      gridTemplateColumns: template,
      alignItems: 'center',
      minHeight: 34,
      fontSize: '12px',
      color: 'grayDark.main',
      bgcolor: 'white.main',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      boxShadow: 'inset 0 -1px rgba(0,0,0,0.10)',
      '& > .MuiBox-root': { height: '100%', display: 'flex', alignItems: 'center' },
    }}
  >
    {children}
  </Gutters>
)

const DataRow: React.FC<{
  template: string
  cells: React.ReactNode[]
  /** Mirrors each column's `attribute.align` so the data sits under its header. */
  aligns?: (React.CSSProperties['textAlign'] | undefined)[]
  width?: number
}> = ({ template, cells, aligns = [], width = 660 }) => (
  <div
    style={{
      width,
      display: 'grid',
      gridTemplateColumns: template,
      alignItems: 'center',
      minHeight: 34,
      fontSize: 13,
      color: '#2b2f38',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}
  >
    {cells.map((c, i) => (
      <div
        key={i}
        style={{
          paddingLeft: 12,
          paddingRight: 12,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textAlign: aligns[i],
        }}
      >
        {c}
      </div>
    ))}
  </div>
)

const TEMPLATE = '210px 110px 150px 130px'

export const ColumnHeaders = () => (
  <div>
    <HeaderRow template={TEMPLATE}>
      <GridListHeaderTitle attribute={attr('deviceName', 'Name', 210)} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('status', 'Status', 110)} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('platform', 'Platform', 150)} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('lastSeen', 'Last seen', 130)} onMouseDown={noop} />
    </HeaderRow>
    <DataRow template={TEMPLATE} cells={['shop-floor-pi', 'Online', 'Raspberry Pi', '2 min ago']} />
    <DataRow template={TEMPLATE} cells={['warehouse-gateway', 'Online', 'Ubuntu 22.04', '6 min ago']} />
    <DataRow template={TEMPLATE} cells={['edge-node-04', 'Offline', 'Debian 12', '3 days ago']} />
  </div>
)

export const StickyRequired = () => (
  <div>
    <HeaderRow template={TEMPLATE}>
      <GridListHeaderTitle attribute={attr('deviceName', 'Name', 210)} onMouseDown={noop} sticky>
        <Icon name="router" size="sm" color="grayDark" inlineLeft />
      </GridListHeaderTitle>
      <GridListHeaderTitle attribute={attr('owner', 'Owner', 110)} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('tags', 'Tags', 150)} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('license', 'License', 130)} onMouseDown={noop} />
    </HeaderRow>
    <DataRow template={TEMPLATE} cells={['shop-floor-pi', 'jamie', 'factory, pilot', 'Professional']} />
    <DataRow template={TEMPLATE} cells={['warehouse-gateway', 'ops', 'warehouse', 'Professional']} />
  </div>
)

export const Alignment = () => (
  <div>
    <HeaderRow template="230px 120px 140px 140px">
      <GridListHeaderTitle attribute={attr('serviceName', 'Service', 230)} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('port', 'Port', 120, 'right')} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('sessions', 'Sessions', 140, 'center')} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('quality', 'Quality', 140, 'right')} onMouseDown={noop} />
    </HeaderRow>
    <DataRow
      template="230px 120px 140px 140px"
      aligns={[undefined, 'right', 'center', 'right']}
      cells={['SSH — shop-floor-pi', '33000', '2', '98%']}
    />
    <DataRow
      template="230px 120px 140px 140px"
      aligns={[undefined, 'right', 'center', 'right']}
      cells={['VNC — shop-floor-pi', '33001', '0', '94%']}
    />
  </div>
)

export const TruncatedLabels = () => (
  <div>
    <HeaderRow template="150px 130px 130px 150px">
      <GridListHeaderTitle
        attribute={attr('deviceName', 'Device name and hostname', 150)}
        onMouseDown={noop}
      />
      <GridListHeaderTitle attribute={attr('externalAddress', 'External address', 130)} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('lastReported', 'Last reported', 130)} onMouseDown={noop} />
      <GridListHeaderTitle attribute={attr('version', 'Agent version', 150)} onMouseDown={noop} />
    </HeaderRow>
    <DataRow
      template="150px 130px 130px 150px"
      cells={['shop-floor-pi', '73.109.24.8', '2 min ago', '4.16.3']}
    />
  </div>
)
