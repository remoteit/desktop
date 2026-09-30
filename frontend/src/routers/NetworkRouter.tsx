import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { ServiceRouter } from './ServiceRouter'
import { NetworksPage } from '../pages/NetworksPage'
import { NetworkUsersPage } from '../pages/NetworkUsersPage'
import { NetworkSharePage } from '../pages/NetworkSharePage'
import { NetworkAddPage } from '../pages/NetworkAddPage'
import { NetworkPage } from '../pages/NetworkPage'
import { LanSharePage } from '../pages/LanSharePage'
import { DynamicPanel } from '../components/DynamicPanel'
import { DeviceNetworksPage } from '../pages/DeviceNetworksPage'
import { DeviceNetworkPage } from '../pages/DeviceNetworkPage'
import { useDeviceSessions } from '../hooks/useDeviceSessions'

// With the device-sessions flag on, Networks are device networks: the list and a network's page are theirs, and the
// rest (adding one, sharing it, its people) is as before.
export const NetworkRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const deviceSessions = useDeviceSessions()
  return (
    <DynamicPanel
      primary={deviceSessions ? <DeviceNetworksPage /> : <NetworksPage />}
      secondary={
        <Switch>
          <Route path="/networks/add">
            <NetworkAddPage />
          </Route>

          <Route path="/networks/:networkID/share">
            <NetworkSharePage />
          </Route>

          <Route path="/networks/:networkID/users">
            <NetworkUsersPage />
          </Route>

          <Route path="/networks/:networkID/:serviceID/lan">
            <LanSharePage />
          </Route>

          <Route path="/networks/:networkID/:serviceID">
            <ServiceRouter basename="/networks/:networkID/:serviceID" />
          </Route>

          <Route path="/networks/:networkID">{deviceSessions ? <DeviceNetworkPage /> : <NetworkPage />}</Route>

          <Route path="/networks">
            <ServiceRouter basename="/networks/:serviceID?/:sessionID?" />
          </Route>
        </Switch>
      }
      root="/networks"
      layout={layout}
    />
  )
}
