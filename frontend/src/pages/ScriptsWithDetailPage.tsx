import React from 'react'
import { Switch, Route, Redirect, useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { FilesPage } from './FilesPage'
import { ScriptPage } from './ScriptPage'
import { JobDetailPage } from './JobDetailPage'
import { JobDeviceDetailPage } from './JobDeviceDetailPage'
import { ScriptRunHistoryPage } from './ScriptRunHistoryPage'
import { ScriptConfigPage } from './ScriptConfigPage'
import { State } from '../store'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { useResizablePanel } from '../hooks/useResizablePanel'

const MIN_WIDTH = 250
const THREE_PANEL_WIDTH = 900
const TWO_PANEL_WIDTH = 600
const DEFAULT_PANEL_WIDTH = 300

export const ScriptsWithDetailPage: React.FC = () => {
  const css = useStyles()
  const location = useLocation()
  const { fileID } = useParams<{ fileID?: string }>()
  const layout = useSelector((state: State) => state.ui.layout)

  const { containerRef, containerWidth } = useContainerWidth()
  const panel1 = useResizablePanel(DEFAULT_PANEL_WIDTH, containerRef, { minWidth: MIN_WIDTH })
  const panel2 = useResizablePanel(DEFAULT_PANEL_WIDTH, containerRef, { minWidth: MIN_WIDTH })
  const panel3 = useResizablePanel(DEFAULT_PANEL_WIDTH, containerRef, { minWidth: MIN_WIDTH })

  // Analyze URL to determine which panels should be shown
  // URL patterns:
  // /script/:fileID - Panel 2 only (script overview)
  // /script/:fileID/edit - Panel 3 (combined edit + run config page)
  // /script/:fileID/history - Panel 3 (run history list)
  // /script/:fileID/:jobID - Panel 3 (job detail)
  // /script/:fileID/:jobID/:jobDeviceID - Panel 3 (job detail) + Panel 4 (device detail)
  const pathParts = location.pathname.split('/').filter(Boolean)

  const hasFileID = pathParts.length >= 2 && pathParts[0] === 'script'
  const isHistoryRoute = pathParts.length >= 3 && pathParts[2] === 'history'
  const isPreparedRoute = pathParts.length >= 3 && pathParts[2] === 'prepared'
  const isRunRoute = pathParts.length >= 3 && pathParts[2] === 'run'
  const isEditRoute = pathParts.length >= 3 && pathParts[2] === 'edit' // matches both /edit and /edit/:jobID
  const isLatestRoute = pathParts.length >= 3 && pathParts[2] === 'latest'
  const hasJobID = pathParts.length >= 3 && !isHistoryRoute && !isPreparedRoute && !isRunRoute && !isLatestRoute && !isEditRoute
  const isJobDeviceRoute = hasJobID && pathParts.length >= 4

  // Panel visibility based on URL
  const showPanel1 = !isJobDeviceRoute // Hide scripts list when viewing device run details
  const showPanel2 = hasFileID // Script overview
  const showPanel3 = isEditRoute || isHistoryRoute || isPreparedRoute || hasJobID // Config page, run history, prepared, or job detail
  const showPanel4 = isJobDeviceRoute // Device run detail (to the right of job detail)

  // Determine max panels based on container width
  const maxPanels = layout.singlePanel
    ? 1
    : containerWidth < TWO_PANEL_WIDTH
      ? 1
      : containerWidth < THREE_PANEL_WIDTH
        ? 2
        : 3

  // Calculate which panels to actually show based on available space
  let visiblePanel1 = false
  let visiblePanel2 = false
  let visiblePanel3 = false
  let visiblePanel4 = false

  if (showPanel4) {
    // Device detail mode: hide Panel 1, show Panels 2+3+4
    if (maxPanels >= 3) {
      visiblePanel2 = showPanel2
      visiblePanel3 = showPanel3
      visiblePanel4 = true
    } else if (maxPanels === 2) {
      visiblePanel3 = showPanel3
      visiblePanel4 = true
    } else {
      visiblePanel4 = true
    }
  } else if (maxPanels >= 3) {
    visiblePanel1 = showPanel1
    visiblePanel2 = showPanel2
    visiblePanel3 = showPanel3
  } else if (maxPanels === 2) {
    if (showPanel3 && showPanel2) {
      visiblePanel2 = true
      visiblePanel3 = true
    } else if (showPanel2) {
      visiblePanel1 = showPanel1
      visiblePanel2 = true
    } else {
      visiblePanel1 = showPanel1
    }
  } else {
    // Single panel - show rightmost active
    if (showPanel3) visiblePanel3 = true
    else if (showPanel2) visiblePanel2 = true
    else visiblePanel1 = showPanel1
  }

  const visiblePanelCount = [visiblePanel1, visiblePanel2, visiblePanel3, visiblePanel4].filter(Boolean).length

  return (
    <Box className={css.wrapper} ref={containerRef}>
      <Box className={css.container}>
        {/* Panel 1 - Scripts List */}
        {visiblePanel1 && (
          <>
            <Box
              className={visiblePanelCount > 1 ? css.panel : css.flexPanel}
              style={visiblePanelCount > 1 ? { width: panel1.width, minWidth: panel1.width } : undefined}
              ref={visiblePanelCount > 1 ? panel1.panelRef : undefined}
            >
              <FilesPage scripts showHeader />
            </Box>
            {visiblePanelCount > 1 && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={panel1.onDown}>
                  <Box className={panel1.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Panel 2 - Script Overview (name, description, run history link) */}
        {visiblePanel2 && (
          <>
            <Box
              className={visiblePanel3 || visiblePanel4 ? css.panel : css.flexPanel}
              style={visiblePanel3 || visiblePanel4 ? { width: panel2.width, minWidth: panel2.width } : undefined}
              ref={visiblePanel3 || visiblePanel4 ? panel2.panelRef : undefined}
            >
              <ScriptPage showMenu={!visiblePanel1} />
            </Box>
            {(visiblePanel3 || visiblePanel4) && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={panel2.onDown}>
                  <Box className={panel2.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Panel 3 - Config Page, Run History, or Job Detail */}
        {visiblePanel3 && (
          <>
            <Box className={visiblePanel4 ? css.panel : css.flexPanel}
              style={visiblePanel4 ? { width: panel3.width, minWidth: panel3.width } : undefined}
              ref={visiblePanel4 ? panel3.panelRef : undefined}
            >
              <Switch>
                <Route path="/script/:fileID/edit/:jobID?">
                  <ScriptConfigPage showBack showMenu={!visiblePanel1 && !visiblePanel2} />
                </Route>
                <Route path="/script/:fileID/run" exact>
                  <Redirect to={`/script/${fileID}/edit`} />
                </Route>
                <Route path="/script/:fileID/history" exact>
                  <ScriptRunHistoryPage showBack showMenu={!visiblePanel1 && !visiblePanel2} />
                </Route>
                <Route path="/script/:fileID/prepared" exact>
                  <ScriptRunHistoryPage showBack showMenu={!visiblePanel1 && !visiblePanel2} prepared />
                </Route>
                <Route path="/script/:fileID/:jobID">
                  <JobDetailPage showBack={!visiblePanel2} showMenu={!visiblePanel1 && !visiblePanel2} />
                </Route>
              </Switch>
            </Box>
            {visiblePanel4 && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={panel3.onDown}>
                  <Box className={panel3.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Panel 4 - Job Device Detail (to the right of job detail) */}
        {visiblePanel4 && (
          <Box className={css.flexPanel}>
            <Route path="/script/:fileID/:jobID/:jobDeviceID" exact>
              <JobDeviceDetailPage showBack showMenu={!visiblePanel1 && !visiblePanel2 && !visiblePanel3} />
            </Route>
          </Box>
        )}
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    overflow: 'hidden',
  },
  panel: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  flexPanel: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minWidth: MIN_WIDTH,
  },
  anchor: {
    position: 'relative',
    height: '100%',
  },
  handle: {
    zIndex: 8,
    position: 'absolute',
    height: '100%',
    marginLeft: -5,
    padding: '0 3px',
    cursor: 'col-resize',
    '& > div': {
      width: 1,
      marginLeft: 1,
      marginRight: 1,
      height: '100%',
      backgroundColor: palette.grayLighter.main,
      transition: 'background-color 100ms 200ms, width 100ms 200ms, margin 100ms 200ms',
    },
    '&:hover > div, & .active': {
      width: 3,
      marginLeft: 0,
      marginRight: 0,
      backgroundColor: palette.primary.main,
    },
  },
}))
