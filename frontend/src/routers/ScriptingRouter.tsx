import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { ScriptsHeader } from '../components/ScriptsHeader'
import { Switch, Route, Redirect } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { FilesPage } from '../pages/FilesPage'
import { JobsPage } from '../pages/JobsPage'
import { Notice } from '../components/Notice'
import { Body } from '../components/Body'
import { Box } from '@mui/material'
import { Pre } from '../components/Pre'

export const ScriptingRouter: React.FC = () => {
  const selected = useSelector((state: State) => state.ui.selected)
  const permissions = useSelector(selectPermissions)

  console.log('PERMISSIONS', permissions)

  return (
    <ScriptsHeader selected={selected}>
      {permissions?.includes('SCRIPTING') ? (
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
      ) : (
        <Body center>
          <Box>
            <Notice severity="warning" gutterBottom>
              You do not have permission to access scripting
            </Notice>
          </Box>
        </Body>
      )}
    </ScriptsHeader>
  )
}
