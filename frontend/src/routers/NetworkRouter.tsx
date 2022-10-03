import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Switch, Route, useParams } from 'react-router-dom'
import { ConnectionPage } from '../pages/ConnectionPage'
import { NetworksPage } from '../pages/NetworksPage'
import { NetworkUsersPage } from '../pages/NetworkUsersPage'
import { NetworkSharePage } from '../pages/NetworkSharePage'
import { NetworkAddPage } from '../pages/NetworkAddPage'
import { NetworkPage } from '../pages/NetworkPage'
import { LanSharePage } from '../pages/LanSharePage'
import { DynamicPanel } from '../components/DynamicPanel'

export const NetworkRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const { serviceID } = useParams<{ serviceID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const {} = useSelector((state: ApplicationState) => ({}))

  useEffect(() => {
    // TODO: load network service on demand
    //   const id = serviceID
    //   if (id && !service) dispatch.devices.fetchService({ id, hidden: true })
    //   console.log('CONNECT PAGE EFFECT', { device, id })
  }, [serviceID])

  return (
    <DynamicPanel
      primary={<NetworksPage />}
      secondary={
        <Switch>
          <Route path="/networks/view/:networkID/share">
            <NetworkSharePage />
          </Route>

          <Route path="/networks/view/:networkID/users">
            <NetworkUsersPage />
          </Route>

          <Route path="/networks/view/:networkID">
            <NetworkPage />
          </Route>

          <Route path="/networks/add">
            <NetworkAddPage />
          </Route>

          <Route path="/networks/:serviceID/lan">
            <LanSharePage />
          </Route>

          <Route path="/networks/:serviceID?">
            <ConnectionPage />
          </Route>
        </Switch>
      }
      layout={layout}
      root="/networks"
    />
  )
}
