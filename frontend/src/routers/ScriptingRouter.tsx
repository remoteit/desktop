import React from 'react'
import { useSelector } from 'react-redux'
import { ScriptingHeader } from '../components/ScriptingHeader'
import { Switch, Route, Redirect, useLocation } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { ScriptAddPage } from '../pages/ScriptAddPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { FilesPage } from '../pages/FilesPage'
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

  if (!location.pathname.includes('new')) layout = { ...layout, singlePanel: true }

  return (
    <DynamicPanel
      primary={
        <ScriptingHeader>
          <Switch>
            <Route path="/scripting/scripts">
              <FilesPage scripts />
            </Route>
            <Route path="/scripting/runs">
              <JobsPage />
            </Route>
            <Route path="/scripting/files">
              <FilesPage />
            </Route>
            <Route path="*">
              <Redirect to={{ pathname: '/scripting/scripts', state: { isRedirect: true } }} />
            </Route>
          </Switch>
        </ScriptingHeader>
      }
      secondary={
        <Switch>
          <Route path="/scripting/scripts/new">
            <ScriptAddPage />
          </Route>
        </Switch>
      }
      layout={layout}
      root="/scripting/:tab?"
    />
  )
}
