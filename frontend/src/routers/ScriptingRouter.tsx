import React from 'react'
import { useSelector } from 'react-redux'
import { Switch, Route, Redirect, useLocation, useParams } from 'react-router-dom'
import { selectPermissions } from '../selectors/organizations'
import { ScriptEditPage } from '../pages/ScriptEditPage'
import { ScriptRunPage } from '../pages/ScriptRunPage'
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

const ScriptSecondaryRoutes: React.FC = () => {
  const { fileID } = useParams<{ fileID: string }>()
  return (
    <Switch>
      {/* Script edit form */}
      <Route path="/script/:fileID/edit" exact>
        <ScriptEditPage />
      </Route>
      {/* New run config (no existing job) */}
      <Route path="/script/:fileID/run" exact>
        <ScriptRunPage />
      </Route>
      <Route path="/script/:fileID/history" exact>
        <Redirect to={`/script/${fileID}/edit`} />
      </Route>
      <Route path="/script/:fileID/prepared" exact>
        <Redirect to={`/script/${fileID}/edit`} />
      </Route>
      {/* Run config for a prepared job — must precede /:jobID/:jobDeviceID */}
      <Route path="/script/:fileID/:jobID/run">
        <ScriptRunPage />
      </Route>
      <Route path="/script/:fileID/:jobID/:jobDeviceID">
        <JobDetailPage />
      </Route>
      <Route path="/script/:fileID/:jobID">
        <JobDetailPage />
      </Route>
      {/* Default script route goes to latest run config */}
      <Route path="/script/:fileID" exact>
        <Redirect to={`/script/${fileID}/latest/run`} />
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
      <Route path="/file" exact>
        <Redirect to="/files" />
      </Route>
      <Route path="/script" exact>
        <Redirect to="/scripts" />
      </Route>
      <Route path="/run" exact>
        <Redirect to="/runs" />
      </Route>
      {/* New script run config (step 2 of new script workflow) */}
      <Route path="/scripts/add/run">
        <DynamicPanel primary={<FilesPage scripts />} secondary={<ScriptRunPage isNew />} layout={layout} />
      </Route>
      {/* New script edit form (step 1 of new script workflow) */}
      <Route path="/scripts/add">
        <DynamicPanel primary={<FilesPage scripts />} secondary={<ScriptAddPage />} layout={layout} />
      </Route>
      {/* Files list with add panel */}
      <Route path="/files/add">
        <DynamicPanel primary={<FilesPage />} secondary={<FileAddPage />} layout={layout} />
      </Route>
      {/* Script detail: primary=job list, secondary=edit/run/job detail, tertiary=file list (triple only) */}
      <Route path="/script/:fileID">
        <DynamicPanel
          primary={<ScriptPage />}
          secondary={<ScriptSecondaryRoutes />}
          tertiary={<FilesPage scripts />}
          root="/script/:fileID"
          layout={layout}
        />
      </Route>
      {/* File detail routes */}
      <Route path="/file/:fileID">
        <DynamicPanel primary={<FilesPage />} secondary={<FileDetailPage />} layout={layout} />
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
