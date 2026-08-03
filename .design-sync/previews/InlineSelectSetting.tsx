import React from 'react'
import { InlineSelectSetting } from 'remoteit-desktop-frontend'

const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

const routeValues = [
  { key: 'failover', name: 'Peer to peer with proxy failover' },
  { key: 'p2p', name: 'Peer to peer only' },
  { key: 'proxy', name: 'Proxy only' },
  { key: 'public', name: 'Public proxy' },
]

const timeoutValues = [
  { key: 0, name: 'Never' },
  { key: 5, name: '5 minutes' },
  { key: 15, name: '15 minutes' },
  { key: 60, name: '60 minutes' },
]

export const Basic = () => (
  <List>
    <InlineSelectSetting
      icon="route"
      label="Routing"
      value="failover"
      values={routeValues}
      resetValue="failover"
      onSave={() => {}}
    />
    <InlineSelectSetting
      icon="clock"
      label="Idle timeout"
      value={15}
      values={timeoutValues}
      resetValue={15}
      onSave={() => {}}
    />
  </List>
)

export const Modified = () => (
  <List>
    <InlineSelectSetting
      icon="route"
      label="Routing"
      value="proxy"
      values={routeValues}
      modified
      resetValue="failover"
      onSave={() => {}}
    />
    <InlineSelectSetting
      icon="clock"
      label="Idle timeout"
      value={0}
      values={timeoutValues}
      displayValue="Never — persistent connection"
      modified
      resetValue={15}
      onSave={() => {}}
    />
  </List>
)

export const Disabled = () => (
  <List>
    <InlineSelectSetting
      icon="lock"
      label="Routing"
      value="proxy"
      values={routeValues}
      disabled
      onSave={() => {}}
    />
    <InlineSelectSetting
      icon="shield"
      label="Access"
      value="restricted"
      values={[
        { key: 'restricted', name: 'Restricted to my IP address' },
        { key: 'open', name: 'Open to any IP address' },
      ]}
      disabled
      onSave={() => {}}
    />
  </List>
)
