import React from 'react'
import { ListItemCheckbox } from 'remoteit-desktop-frontend'

const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

export const CheckedStates = () => (
  <List>
    <ListItemCheckbox checked label="Enable connection on startup" onClick={() => {}} />
    <ListItemCheckbox checked={false} label="Require password to disconnect" onClick={() => {}} />
    <ListItemCheckbox indeterminate label="Production devices (3 of 8 selected)" onClick={() => {}} />
  </List>
)

export const WithSubLabels = () => (
  <List>
    <ListItemCheckbox
      checked
      label="Manage devices"
      subLabel="Register, rename and delete devices in this organization"
      onClick={() => {}}
    />
    <ListItemCheckbox
      checked
      label="Manage services"
      subLabel="Add and edit services on any device"
      onClick={() => {}}
    />
    <ListItemCheckbox
      checked={false}
      label="Manage billing"
      subLabel="View invoices and change the subscription plan"
      onClick={() => {}}
    />
  </List>
)

export const Disabled = () => (
  <List>
    <ListItemCheckbox
      checked
      disabled
      label="View devices"
      subLabel="Always granted — cannot be removed"
      onClick={() => {}}
    />
    <ListItemCheckbox
      checked={false}
      disabled
      label="Transfer ownership"
      subLabel="Only the account owner can transfer devices"
      onClick={() => {}}
    />
  </List>
)

export const WithTrailingContent = () => (
  <List>
    <ListItemCheckbox checked label="raspberrypi-field-01" subLabel="SSH · Port 22" onClick={() => {}}>
      <span style={{ fontSize: 12, opacity: 0.6, whiteSpace: 'nowrap' }}>online</span>
    </ListItemCheckbox>
    <ListItemCheckbox checked={false} label="jump-host-us-west" subLabel="VNC · Port 5900" onClick={() => {}}>
      <span style={{ fontSize: 12, opacity: 0.6, whiteSpace: 'nowrap' }}>offline</span>
    </ListItemCheckbox>
  </List>
)
