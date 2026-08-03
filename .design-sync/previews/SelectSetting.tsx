import React from 'react'
import { SelectSetting } from 'remoteit-desktop-frontend'

const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

const routeValues = [
  { key: 'failover', name: 'Peer to peer with proxy failover', description: 'Try a direct connection, fall back to the proxy' },
  { key: 'p2p', name: 'Peer to peer only', description: 'Direct connection only — fails if a peer path is unavailable' },
  { key: 'proxy', name: 'Proxy only', description: 'Always route through the remote.it proxy' },
  { key: 'public', name: 'Public proxy', description: 'Reachable by anyone with the URL' },
]

const themeValues = [
  { key: 'system', name: 'Match system' },
  { key: 'light', name: 'Light' },
  { key: 'dark', name: 'Dark' },
]

export const Basic = () => (
  <List>
    <SelectSetting
      icon="route"
      label="Routing"
      value="failover"
      defaultValue="failover"
      values={routeValues}
      onChange={() => {}}
    />
    <SelectSetting icon="palette" label="Appearance" value="system" values={themeValues} onChange={() => {}} />
  </List>
)

export const ModifiedAndHelp = () => (
  <List>
    <SelectSetting
      icon="route"
      label="Routing"
      value="proxy"
      defaultValue="failover"
      values={routeValues}
      helpMessage="Peer to peer is faster, but some networks block it."
      onChange={() => {}}
    />
    <SelectSetting
      icon="clock"
      label="Idle timeout"
      value="60"
      modified
      values={[
        { key: '0', name: 'Never' },
        { key: '15', name: '15 minutes' },
        { key: '60', name: '60 minutes' },
      ]}
      onChange={() => {}}
    />
  </List>
)

export const DisabledAndHiddenIcon = () => (
  <List>
    <SelectSetting
      icon="lock"
      label="Routing"
      value="proxy"
      values={routeValues}
      disabled
      onChange={() => {}}
    />
    <SelectSetting
      hideIcon
      label="Log level"
      value="verbose"
      values={[
        { key: 'error', name: 'Error' },
        { key: 'info', name: 'Info' },
        { key: 'verbose', name: 'Verbose' },
      ]}
      onChange={() => {}}
    />
  </List>
)
