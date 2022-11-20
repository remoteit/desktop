import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { ConnectionPage } from '../pages/ConnectionPage'
import { NetworksPage } from '../pages/NetworksPage'
import { DeviceContextWrapper } from '../components/DeviceContextWrapper'
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
          <Route exact path="/networks/view/:networkID/share">
            <NetworkSharePage />
          </Route>

          <Route exact path="/networks/view/:networkID/users">
            <NetworkUsersPage />
          </Route>

          <Route exact path="/networks/view/:networkID">
            <NetworkPage />
          </Route>

          <Route path="/networks/add">
            <NetworkAddPage />
          </Route>

          <Route path="/networks/:serviceID/lan">
            <DeviceContextWrapper>
              <LanSharePage />
            </DeviceContextWrapper>
          </Route>

          <Route path="/networks/:serviceID?">
            <DeviceContextWrapper>
              <ConnectionPage />
            </DeviceContextWrapper>
          </Route>
        </Switch>
      }
      layout={layout}
      root="/networks"
    />
  )
}
