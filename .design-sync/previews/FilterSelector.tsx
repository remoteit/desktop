import React from 'react'
import { FilterSelector } from 'remoteit-desktop-frontend'

// FilterSelector is the body of the device-list filter menu: a dense list where
// the active option carries the check glyph. `value` may be a single value or
// an array (multi-select, e.g. tags). Note isActive() strips a leading "-" from
// a single value, so the descending form of a sort key still highlights its row.
const Menu: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 240, paddingTop: 4, paddingBottom: 4 }}>{children}</div>
)

const Header: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      opacity: 0.5,
      padding: '4px 16px 6px',
    }}
  >
    {children}
  </div>
)

export const DeviceState = () => (
  <Menu>
    <FilterSelector
      icon="check"
      value="active"
      onSelect={() => {}}
      filterList={[
        { value: 'all', name: 'All devices' },
        { value: 'active', name: 'Online' },
        { value: 'inactive', name: 'Offline' },
        { value: 'restore', name: 'Restorable' },
      ]}
    />
  </Menu>
)

export const SortOrder = () => (
  <Menu>
    <FilterSelector
      icon="check"
      value="-name"
      onSelect={() => {}}
      filterList={[
        { value: 'name', name: 'Device name' },
        { value: 'state', name: 'Status' },
        { value: 'quality', name: 'Connection quality' },
        { value: 'created', name: 'Date registered' },
      ]}
    >
      <Header>Sort by</Header>
    </FilterSelector>
  </Menu>
)

export const TagFilter = () => (
  <Menu>
    <FilterSelector
      icon="check"
      value={['production', 'warehouse']}
      onSelect={() => {}}
      filterList={[
        { value: 'production', name: 'production', color: '#E65B4C' },
        { value: 'warehouse', name: 'warehouse', color: '#EF922E' },
        { value: 'lab', name: 'lab', color: '#63BD87' },
        { value: 'decommissioned', name: 'decommissioned', color: '#797c86' },
      ]}
    >
      <Header>Tags</Header>
    </FilterSelector>
  </Menu>
)

export const OwnerFilter = () => (
  <Menu>
    <FilterSelector
      icon="check"
      value="all"
      onSelect={() => {}}
      filterList={[
        { value: 'all', name: 'Everyone' },
        { value: 'me', name: 'dana.li@remote.it' },
        { value: 'shared', name: 'Shared with me' },
      ]}
    >
      <Header>Owner</Header>
    </FilterSelector>
  </Menu>
)
