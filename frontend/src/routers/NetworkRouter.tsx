import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { ConnectionPage } from '../pages/ConnectionPage'
import { NetworksPage } from '../pages/NetworksPage'
import { NetworkUsersPage } from '../pages/NetworkUsersPage'
import { NetworkSharePage } from '../pages/NetworkSharePage'
import { NetworkAddPage } from '../pages/NetworkAddPage'
import { NetworkPage } from '../pages/NetworkPage'
import { LanSharePage } from '../pages/LanSharePage'
import { DynamicPanel } from '../components/DynamicPanel'

export const NetworkRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  return (
    <DynamicPanel
      primary={<NetworksPage />}
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
            <ConnectionPage />
          </Route>

          <Route path="/networks/:networkID">
            <NetworkPage />
          </Route>
        </Switch>
      }
      layout={layout}
      root="/networks"
    />
  )
}
