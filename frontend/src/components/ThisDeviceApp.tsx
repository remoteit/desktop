import React from 'react'
import { Box } from '@mui/material'
import { Redirect, Route, Switch } from 'react-router-dom'
import { Panel } from './Panel'
import { ThisDevicePage } from '../pages/ThisDevicePage'

/* The portal in an app (a shell's thisDevice present) with no one signed in to it — signed out, or signed in on the app
   with remote.it out of reach (device-package docs/one-app-plan.md, "This device works signed out and offline"). This
   device is all of it: the machine's own controls go through the bridge, which needs neither a sign-in nor a network,
   and the sign-in is on it. Everything else is the account's — devices, sharing, the nav — and comes with the sign-in,
   which reloads the page as the person. So This device is the home, and any other address lands there rather than on a
   page that would wait on graphql. A plain browser never gets here: it has no thisDevice, and signs in as before. */
export const ThisDeviceApp: React.FC<{ layout: ILayout }> = ({ layout }) => (
  <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'row' }} data-this-device-app>
    <Switch>
      <Route path="/this-device">
        {/* No sidebar here, so the page takes the width the sidebar would have. */}
        <Panel layout={{ ...layout, sidePanelWidth: 0 }} header={false}>
          <ThisDevicePage />
        </Panel>
      </Route>
      <Redirect to={{ pathname: '/this-device', state: { isRedirect: true } }} />
    </Switch>
  </Box>
)
