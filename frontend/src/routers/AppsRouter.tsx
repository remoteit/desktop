import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { DynamicPanel } from '../components/DynamicPanel'
import { Panel } from '../components/Panel'
import { AppsPage } from '../pages/AppsPage'
import { AppPage } from '../pages/AppPage'

/* The Apps pages (presence-server docs/device-apps-design.md, "The Apps pages"): /apps, the account's catalogue, and
   beside it /apps/:appID, the app in the catalogue. */
export const AppsRouter: React.FC<{ layout: ILayout }> = ({ layout }) => (
  <Switch>
    <Route path="/apps/:appID">
      <DynamicPanel
        primary={<AppsPage />}
        secondary={<AppPage />}
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
