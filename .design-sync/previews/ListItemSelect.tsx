import React from 'react'
import { ListItemSelect } from 'remoteit-desktop-frontend'

const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

const routeOptions = [
  { label: 'Peer to peer', value: 'p2p' },
  { label: 'Proxy', value: 'proxy' },
  { label: 'Peer to peer with proxy failover', value: 'failover' },
]

const logOptions = [
  { label: 'Error', value: 'error' },
  { label: 'Warning', value: 'warn' },
  { label: 'Info', value: 'info' },
  { label: 'Verbose', value: 'verbose' },
]

export const Basic = () => (
  <List>
    <ListItemSelect
      icon="route"
      label="Connection routing"
      value="failover"
      options={routeOptions}
      onChange={() => {}}
    />
    <ListItemSelect icon="file-alt" label="Log level" value="info" options={logOptions} onChange={() => {}} />
  </List>
)

export const WithSubLabel = () => (
  <List>
    <ListItemSelect
      icon="globe"
      label="Default region"
      subLabel="Where new proxy connections are terminated"
      value="us-west"
      options={[
        { label: 'US West (Oregon)', value: 'us-west' },
        { label: 'US East (Virginia)', value: 'us-east' },
        { label: 'Europe (Frankfurt)', value: 'eu-central' },
      ]}
      onChange={() => {}}
    />
    <ListItemSelect
      icon="clock"
      label="Idle timeout"
      subLabel="Close the connection after this much inactivity"
      value="15"
      options={[
        { label: 'Never', value: '0' },
        { label: '5 minutes', value: '5' },
        { label: '15 minutes', value: '15' },
        { label: '60 minutes', value: '60' },
      ]}
      onChange={() => {}}
    />
  </List>
)

export const Disabled = () => (
  <List>
    <ListItemSelect
      icon="lock"
      label="Connection routing"
      subLabel="Locked by your organization policy"
      value="proxy"
      options={routeOptions}
      disabled
      onChange={() => {}}
    />
  </List>
)
