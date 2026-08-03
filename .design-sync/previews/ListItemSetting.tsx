import React from 'react'
import { ListItemSetting } from 'remoteit-desktop-frontend'

const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

export const Toggles = () => (
  <List>
    <ListItemSetting
      toggle
      icon="power-off"
      label="Launch on startup"
      subLabel="Start Remote.It when you sign in"
    />
    <ListItemSetting
      toggle={false}
      icon="bell"
      label="Notifications"
      subLabel="Alert me when a device goes offline"
    />
    <ListItemSetting toggle icon="moon" label="Dark mode" />
  </List>
)

export const WithButton = () => (
  <List>
    <ListItemSetting
      icon="arrow-down-to-line"
      label="Check for updates"
      subLabel="Version 3.47.0 — up to date"
      button="Check"
      onButtonClick={() => {}}
    />
    <ListItemSetting
      icon="folder-open"
      label="Log files"
      subLabel="~/Library/Application Support/remoteit"
      button="Reveal"
      onButtonClick={() => {}}
    />
  </List>
)

export const States = () => (
  <List>
    <ListItemSetting icon="lock" label="Managed by your organization" disabled toggle />
    <ListItemSetting
      icon="pen"
      label="Custom port range"
      subLabel="33000 – 42000"
      modified
      button="Reset"
    />
    <ListItemSetting
      icon="trash"
      iconColor="danger"
      label="Remove this device"
      subLabel="Deletes the device and all of its services"
      confirm
      confirmProps={{ title: 'Remove device?', children: 'This cannot be undone.' }}
      button="Remove"
    />
  </List>
)

export const WithContent = () => (
  <List>
    <ListItemSetting
      icon="network-wired"
      label="Local network sharing"
      subLabel="Allow other devices on this network to use this connection"
      toggle
      secondaryContent={
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, opacity: 0.7 }}>
          192.168.1.24
        </span>
      }
    />
    <ListItemSetting
      icon="clock"
      label="Idle timeout"
      subLabel="Close the connection after inactivity"
      secondaryContent={<span style={{ fontSize: 13 }}>15 min</span>}
    />
  </List>
)
