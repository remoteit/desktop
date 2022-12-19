import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { Switch, Route } from 'react-router-dom'
import { ServiceDefaultsPage } from '../pages/ServiceDefaultsPage'
import { ServiceHeaderMenu } from '../components/ServiceHeaderMenu'
import { ServiceUsersPage } from '../pages/ServiceUsersPage'
import { NoConnectionPage } from '../pages/NoConnectionPage'
import { ConnectAdvanced } from '../components/ConnectAdvanced'
import { ServiceEditPage } from '../pages/ServiceEditPage'
import { LanSharePage } from '../pages/LanSharePage'
import { SharePage } from '../pages/SharePage'
import { Connect } from '../components/Connect'

export const ServiceRouter: React.FC<{ basename: string }> = ({ basename }) => {
  const { device, instance, service, connection } = useContext(DeviceContext)

  if (!service || !instance) return <NoConnectionPage />

  return (
    <Switch>
      <Route path={[`${basename}/users/share`, `${basename}/users/:userID`, `${basename}/share`]}>
        <SharePage />
      </Route>
      <Route path={basename}>
        <ServiceHeaderMenu backgroundColor={connection.enabled ? 'primaryBackground' : 'grayLighter'}>
          <Switch>
            <Route path={`${basename}/users`}>
              <ServiceUsersPage device={device} />
            </Route>
            <Route path={`${basename}/edit`}>
              <ServiceEditPage device={device} />
            </Route>
            <Route path={`${basename}/defaults`}>
              <ServiceDefaultsPage />
            </Route>
            <Route path={`${basename}/lan`}>
              <LanSharePage />
            </Route>
            <Route path={`${basename}/advanced`}>
              <ConnectAdvanced />
            </Route>
            <Route path={basename}>
              <Connect />
            </Route>
          </Switch>
        </ServiceHeaderMenu>
      </Route>
    </Switch>
  )
}
