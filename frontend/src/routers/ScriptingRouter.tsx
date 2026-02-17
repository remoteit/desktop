import React from 'react'
import { useSelector } from 'react-redux'
import { Switch, Route, Redirect, useLocation, useParams } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { ScriptConfigPage } from '../pages/ScriptConfigPage'
import { JobDeviceDetailPage } from '../pages/JobDeviceDetailPage'
import { JobDetailPage } from '../pages/JobDetailPage'
import { FileDetailPage } from '../pages/FileDetailPage'
import { ScriptAddPage } from '../pages/ScriptAddPage'
import { FileAddPage } from '../pages/FileAddPage'
import { ScriptPage } from '../pages/ScriptPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { FilesPage } from '../pages/FilesPage'
import { JobsPage } from '../pages/JobsPage'
import { Notice } from '../components/Notice'
import { Panel } from '../components/Panel'
import { Body } from '../components/Body'
import { Box } from '@mui/material'

const ScriptTertiaryRoutes: React.FC = () => {
  const { fileID } = useParams<{ fileID: string }>()
  return (
    <Switch>
      <Route path="/script/:fileID/edit/:jobID?">
        <ScriptConfigPage />
      </Route>
      <Route path="/script/:fileID/run" exact>
        <Redirect to={`/script/${fileID}/edit`} />
      </Route>
      <Route path="/script/:fileID/history" exact>
        <Redirect to={`/script/${fileID}`} />
      </Route>
      <Route path="/script/:fileID/prepared" exact>
        <Redirect to={`/script/${fileID}`} />
      </Route>
      <Route path="/script/:fileID/:jobID/:jobDeviceID">
        <JobDeviceDetailPage showBack />
      </Route>
      <Route path="/script/:fileID/:jobID">
        <JobDetailPage showBack />
      </Route>
    </Switch>
  )
}

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
  if (
    (locationParts[1] === 'scripts' && locationParts.length === 2) ||
    (locationParts[1] === 'files' && locationParts.length === 2) ||
    locationParts[1] === 'runs'
  )
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
      {/* Script detail routes - triple-panel capable */}
      <Route path="/script/:fileID">
        <DynamicPanel
          primary={<FilesPage scripts />}
          secondary={<ScriptPage />}
          tertiary={<ScriptTertiaryRoutes />}
          layout={layout}
          root="/script/:fileID"
          tertiaryRoot={['/script/:fileID/edit', '/script/:fileID/:jobID']}
        />
      </Route>
      {/* File detail routes */}
      <Route path="/file/:fileID">
        <DynamicPanel
          primary={<FilesPage />}
          secondary={<FileDetailPage />}
          layout={layout}
          root="/file/:fileID"
        />
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
