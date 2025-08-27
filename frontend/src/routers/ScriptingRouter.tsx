import React from 'react'
import { useSelector } from 'react-redux'
import { Switch, Route, useLocation } from 'react-router-dom'
import { JobDeviceDetailPage } from '../pages/JobDeviceDetailPage'
import { selectPermissions } from '../selectors/organizations'
import { ScriptEditPage } from '../pages/ScriptEditPage'
import { ScriptAddPage } from '../pages/ScriptAddPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { FilesPage } from '../pages/FilesPage'
import { ScriptPage } from '../pages/ScriptPage'
import { JobsPage } from '../pages/JobsPage'
import { Notice } from '../components/Notice'
import { Panel } from '../components/Panel'
import { Body } from '../components/Body'
import { Box } from '@mui/material'

export const ScriptingRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const location = useLocation()
  const permissions = useSelector(selectPermissions)

  if (!permissions.includes('SCRIPTING'))
    return (
      <Panel layout={layout}>
        <Body center>
          <Box>
            <Notice severity="warning" gutterBottom>
              You do not have permission to access scripting
            </Notice>
          </Box>
        </Body>
      </Panel>
    )

  const locationParts = location.pathname.split('/')
  if ((locationParts[1] === 'scripts' && locationParts.length === 2) || locationParts[1] === 'runs')
    layout = { ...layout, singlePanel: true }

  return (
    <DynamicPanel
      primary={
        <Switch>
          <Route path="/runs/:fileID?">
            <JobsPage />
          </Route>
          <Route path="/scripts/:fileID?">
            <FilesPage scripts />
          </Route>
          <Route path="/script/:fileID/:jobID?/:jobDeviceID?">
            <ScriptPage layout={layout} />
          </Route>
        </Switch>
      }
      secondary={
        <Switch>
          <Route path="/scripts/add">
            <ScriptAddPage />
          </Route>
          <Route path="/scripts/:fileID">
            <ScriptEditPage />
          </Route>
          <Route path="/script/:fileID/:jobID/edit">
            <ScriptEditPage />
          </Route>
          <Route path="/script/:fileID/:jobID/:jobDeviceID?">
            <JobDeviceDetailPage />
          </Route>
        </Switch>
      }
      layout={layout}
      root={['/script/:fileID?/:jobID?', '/scripts', '/runs/:jobID?']}
    />
  )
}
