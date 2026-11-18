import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { DynamicPanel } from '../components/DynamicPanel'
import { Panel } from '../components/Panel'
import { AppsPage } from '../pages/AppsPage'
import { AppPage } from '../pages/AppPage'
import { AppAddDialog } from '../pages/AppAddDialog'
import { NewAppPage } from '../pages/NewAppPage'
import { BuildAppPage } from '../pages/BuildAppPage'

/* The Apps pages (presence-server docs/device-apps-design.md, "The Apps pages"): /apps, the account's catalogue, and
   beside it /apps/:appID, the app in the catalogue; and /apps/:appID/add, Add as a dialog over the app. A publisher's
   /apps/new (New app) and /apps/build (Build it yourself; presence-server docs/device-apps-new-app.md) come first: an
   app id always holds a dot, so neither reads as one. */
export const AppsRouter: React.FC<{ layout: ILayout }> = ({ layout }) => (
  <Switch>
    <Route path="/apps/build" exact>
      <Panel layout={{ ...layout, singlePanel: true }}>
        <BuildAppPage />
      </Panel>
    </Route>
    <Route path="/apps/new" exact>
      <Panel layout={{ ...layout, singlePanel: true }}>
        <NewAppPage />
      </Panel>
    </Route>
    <Route path="/apps/:appID">
      <DynamicPanel
        primary={<AppsPage />}
        secondary={
          <>
            <AppPage />
            <Route path="/apps/:appID/add">
              <AppAddDialog />
            </Route>
          </>
        }
        root="/apps"
        layout={layout}
      />
    </Route>
    <Route path="/apps" exact>
      <Panel layout={{ ...layout, singlePanel: true }}>
        <AppsPage />
      </Panel>
    </Route>
  </Switch>
)
