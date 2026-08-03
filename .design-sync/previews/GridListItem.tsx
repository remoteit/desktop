import React from 'react'
import { GridListItem, Icon } from 'remoteit-desktop-frontend'

/**
 * Standalone rows: in the app GridList supplies the `inline-grid` template to
 * every `.MuiListItemButton-root`. Here that same template is passed per row
 * through `sx` so the columns line up without a GridList parent.
 */
const GRID = {
  display: 'inline-grid',
  alignItems: 'center',
  width: '100%',
  gridTemplateColumns: '210px 110px 150px 120px',
  fontSize: '14px',
  color: 'grayDarkest.main',
}

const Panel: React.FC<{ children?: React.ReactNode; width?: number }> = ({ children, width = 620 }) => (
  <div
    style={{
      width,
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 8,
      padding: '6px 0',
    }}
  >
    {children}
  </div>
)

const Cell: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="attribute" style={{ display: 'flex', alignItems: 'center' }}>
    {children}
  </div>
)

const Status: React.FC<{ online?: boolean }> = ({ online }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <Icon name="circle" type="solid" size="xxs" color={online ? 'success' : 'gray'} />
    {online ? 'Online' : 'Offline'}
  </span>
)

const Name: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span style={{ fontWeight: 500 }}>{children}</span>
)

export const DeviceRows = () => (
  <Panel>
    <GridListItem
      sx={GRID}
      icon={<Icon name="router" size="md" color="primary" fixedWidth />}
      required={<Name>shop-floor-pi</Name>}
    >
      <Cell>
        <Status online />
      </Cell>
      <Cell>Raspberry Pi</Cell>
      <Cell>2 min ago</Cell>
    </GridListItem>
    <GridListItem
      sx={GRID}
      icon={<Icon name="server" size="md" color="primary" fixedWidth />}
      required={<Name>warehouse-gateway</Name>}
    >
      <Cell>
        <Status online />
      </Cell>
      <Cell>Ubuntu 22.04</Cell>
      <Cell>6 min ago</Cell>
    </GridListItem>
    <GridListItem
      sx={GRID}
      icon={<Icon name="microchip" size="md" color="gray" fixedWidth />}
      required={<Name>edge-node-04</Name>}
    >
      <Cell>
        <Status />
      </Cell>
      <Cell>Debian 12</Cell>
      <Cell>3 days ago</Cell>
    </GridListItem>
  </Panel>
)

export const Selected = () => (
  <Panel>
    <GridListItem
      sx={GRID}
      selected
      icon={<Icon name="router" size="md" color="primary" fixedWidth />}
      required={<Name>shop-floor-pi</Name>}
    >
      <Cell>
        <Status online />
      </Cell>
      <Cell>Raspberry Pi</Cell>
      <Cell>2 min ago</Cell>
    </GridListItem>
    <GridListItem
      sx={GRID}
      icon={<Icon name="laptop" size="md" color="primary" fixedWidth />}
      required={<Name>jamie-macbook</Name>}
    >
      <Cell>
        <Status online />
      </Cell>
      <Cell>macOS 14</Cell>
      <Cell>just now</Cell>
    </GridListItem>
    <GridListItem
      sx={GRID}
      disabled
      icon={<Icon name="server" size="md" color="gray" fixedWidth />}
      required={<Name>legacy-vpn-box</Name>}
    >
      <Cell>
        <Status />
      </Cell>
      <Cell>CentOS 7</Cell>
      <Cell>11 months ago</Cell>
    </GridListItem>
  </Panel>
)

export const StickyCenter = () => (
  <Panel width={480}>
    <GridListItem
      sx={{ ...GRID, gridTemplateColumns: '60px 190px 110px 100px' }}
      stickyCenter
      icon={<Icon name="terminal" size="md" color="primary" />}
    >
      <Cell>SSH</Cell>
      <Cell>127.0.0.1:22</Cell>
      <Cell>33000</Cell>
    </GridListItem>
    <GridListItem
      sx={{ ...GRID, gridTemplateColumns: '60px 190px 110px 100px' }}
      stickyCenter
      icon={<Icon name="desktop" size="md" color="primary" />}
    >
      <Cell>VNC</Cell>
      <Cell>127.0.0.1:5900</Cell>
      <Cell>33001</Cell>
    </GridListItem>
    <GridListItem
      sx={{ ...GRID, gridTemplateColumns: '60px 190px 110px 100px' }}
      stickyCenter
      icon={<Icon name="globe" size="md" color="primary" />}
    >
      <Cell>HTTP admin</Cell>
      <Cell>127.0.0.1:8080</Cell>
      <Cell>33002</Cell>
    </GridListItem>
  </Panel>
)

/**
 * `mobile` drops the children (the attribute columns) and keeps only the sticky
 * icon + `required` slot. MUI's ListItemIcon is inline-flex, so a block-level
 * sub-label inside `required` would wrap back under the icon — the inline-block
 * wrapper below keeps the two lines stacked against the device name instead.
 */
const Stacked: React.FC<{ name: string; detail: string }> = ({ name, detail }) => (
  <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <Name>{name}</Name>
    <span style={{ display: 'block', fontSize: 12, opacity: 0.6 }}>{detail}</span>
  </span>
)

export const MobileRow = () => (
  <Panel width={320}>
    <GridListItem
      sx={{ ...GRID, gridTemplateColumns: '100%' }}
      mobile
      icon={<Icon name="router" size="md" color="primary" fixedWidth />}
      required={<Stacked name="shop-floor-pi" detail="Raspberry Pi · 5 services" />}
    >
      <Cell>Online</Cell>
      <Cell>2 min ago</Cell>
    </GridListItem>
    <GridListItem
      sx={{ ...GRID, gridTemplateColumns: '100%' }}
      mobile
      icon={<Icon name="server" size="md" color="primary" fixedWidth />}
      required={<Stacked name="warehouse-gateway" detail="Ubuntu 22.04 · 3 services" />}
    >
      <Cell>Online</Cell>
      <Cell>6 min ago</Cell>
    </GridListItem>
    <GridListItem
      sx={{ ...GRID, gridTemplateColumns: '100%' }}
      mobile
      icon={<Icon name="microchip" size="md" color="gray" fixedWidth />}
      required={<Stacked name="edge-node-04" detail="Debian 12 · offline" />}
    >
      <Cell>Offline</Cell>
      <Cell>3 days ago</Cell>
    </GridListItem>
  </Panel>
)
