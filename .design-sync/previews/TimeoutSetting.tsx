import React from 'react'
import { TimeoutSetting } from 'remoteit-desktop-frontend'

const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

const service: any = {
  id: '80:00:00:00:01:0A:2F:C4',
  deviceID: '80:00:00:00:01:0A:2F:C0',
  name: 'SSH',
  subdomain: 'cranky-otter',
  type: 'SSH',
  typeID: 28,
  state: 'active',
  port: 22,
  host: '127.0.0.1',
  attributes: { targetHost: '192.168.1.24', route: 'failover' },
}

const connection = (overrides: any): any => ({
  id: service.id,
  deviceID: service.deviceID,
  name: 'cranky-otter',
  owner: { id: 'u-1', email: 'ops@remote.it' },
  online: true,
  enabled: false,
  timeout: 15,
  targetHost: '192.168.1.24',
  typeID: 28,
  ...overrides,
})

export const DefaultTimeout = () => (
  <List>
    <TimeoutSetting service={service} connection={connection({ timeout: 15 })} />
  </List>
)

export const ModifiedAndNever = () => (
  <List>
    <TimeoutSetting service={service} connection={connection({ timeout: 60 })} />
    <TimeoutSetting service={service} connection={connection({ timeout: 0 })} />
  </List>
)

export const DisabledStates = () => (
  <List>
    <TimeoutSetting service={service} connection={connection({ timeout: 30, connected: true, enabled: true })} />
    <TimeoutSetting service={service} connection={connection({ public: true })} />
  </List>
)
