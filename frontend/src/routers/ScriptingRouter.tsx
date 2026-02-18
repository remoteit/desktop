import React from 'react'
import { useSelector } from 'react-redux'
import { Switch, Route, useLocation } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { ScriptsWithDetailPage } from '../pages/ScriptsWithDetailPage'
import { FilesWithDetailPage } from '../pages/FilesWithDetailPage'
import { ScriptAddPage } from '../pages/ScriptAddPage'
import { FileAddPage } from '../pages/FileAddPage'
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

  const locationParts = location.pathname.split('/')
  
  // Use single panel for scripts/files list and runs
  if ((locationParts[1] === 'scripts' && locationParts.length === 2) || 
      (locationParts[1] === 'files' && locationParts.length === 2) || 
      locationParts[1] === 'runs')
    layout = { ...layout, singlePanel: true }

  return (
    <Switch>
      {/* Scripts list with add panel */}
      <Route path="/scripts/add">
        <DynamicPanel
          primary={<FilesPage scripts />}
          secondary={<ScriptAddPage />}
          layout={layout}
          root="/scripts"
        />
      </Route>
      {/* Files list with add panel */}
      <Route path="/files/add">
        <DynamicPanel
          primary={<FilesPage />}
          secondary={<FileAddPage />}
          layout={layout}
          root="/files"
        />
      </Route>
      {/* Script detail routes - multi-panel layout */}
      <Route path="/script/:fileID">
        <Panel layout={layout} header={false}>
          <ScriptsWithDetailPage />
        </Panel>
      </Route>
      {/* File detail routes - multi-panel layout */}
      <Route path="/file/:fileID">
        <Panel layout={layout} header={false}>
          <FilesWithDetailPage />
        </Panel>
      </Route>
      {/* Jobs/runs page */}
      <Route path="/runs/:fileID?">
        <Panel layout={layout}>
          <JobsPage />
        </Panel>
      </Route>
      {/* Files list */}
      <Route path="/files">
        <Panel layout={layout}>
          <FilesPage />
        </Panel>
      </Route>
      {/* Scripts list */}
      <Route path="/scripts">
        <Panel layout={layout}>
          <FilesPage scripts />
        </Panel>
      </Route>
    </Switch>
  )
}
