import React from 'react'
import { useSelector } from 'react-redux'
import { Switch, Route, Redirect, useLocation } from 'react-router-dom'
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
  if (
    'runs' === locationParts[2] ||
    (['scripts', 'files', 'add'].includes(locationParts[2]) && locationParts.length === 3)
  )
    layout = { ...layout, singlePanel: true }

  return (
    <DynamicPanel
      primary={
        <Switch>
          <Route path="/scripting/add">
            <ScriptAddPage center />
          </Route>
          <Route path="/scripting/files">
            <FilesPage />
          </Route>
          <Route path="/scripting/runs/:fileID?">
            <JobsPage />
          </Route>
          <Route path="/scripting/scripts/:fileID?">
            <FilesPage scripts />
          </Route>
          <Route path="/script/:fileID/:jobID?/:jobDeviceID?">
            <ScriptPage />
          </Route>
          <Route path="*">
            <Redirect to={{ pathname: '/scripting/scripts', state: { isRedirect: true } }} />
          </Route>
        </Switch>
      }
      secondary={
        <Switch>
          <Route path="/scripting/scripts/add">
            <ScriptAddPage />
          </Route>
          <Route path="/scripting/scripts/:fileID">
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
      root="/scripting/:tab?/:filter?"
    />
  )
}
