import React from 'react'
import { Switch, Route, useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { FilesPage } from './FilesPage'
import { ScriptPage } from './ScriptPage'
import { ScriptDetailPage } from './ScriptDetailPage'
import { JobDetailPage } from './JobDetailPage'
import { ScriptRunPage } from './ScriptRunPage'
import { JobDeviceDetailPage } from './JobDeviceDetailPage'
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

  // Analyze URL to determine which panels should be shown
  // URL patterns:
  // /script/:fileID - Panel 2 only (script summary with runs list)
  // /script/:fileID/:jobID/edit - Panel 3 (edit page)
  // /script/:fileID/:jobID - Panel 3 (job detail)
  // /script/:fileID/:jobID/:jobDeviceID - Panel 3 (job device details)
  // /script/:fileID/run - Panel 3 (configure & run)
  const pathParts = location.pathname.split('/').filter(Boolean)
  
  const hasFileID = pathParts.length >= 2 && pathParts[0] === 'script'
  const hasJobID = pathParts.length >= 3 && pathParts[2] !== 'run'
  const isEditRoute = pathParts.includes('edit')
  const isRunRoute = pathParts[pathParts.length - 1] === 'run'
  const isJobDeviceRoute = pathParts.length >= 4 && pathParts[3] !== 'edit' && pathParts[3] !== 'run'

  // Panel visibility based on URL
  const showPanel1 = true // Always available
  const showPanel2 = hasFileID // Script summary with runs list
  const showPanel3 = hasJobID || isEditRoute || isRunRoute || isJobDeviceRoute // Any detail view

  // Determine max panels based on container width
  const maxPanels = layout.singlePanel ? 1 :
    containerWidth < TWO_PANEL_WIDTH ? 1 :
    containerWidth < THREE_PANEL_WIDTH ? 2 : 3

  // Calculate which panels to actually show based on available space
  // Priority: rightmost active panel takes precedence
  let visiblePanel1 = false
  let visiblePanel2 = false
  let visiblePanel3 = false

  if (maxPanels >= 3) {
    visiblePanel1 = showPanel1
    visiblePanel2 = showPanel2
    visiblePanel3 = showPanel3
  } else if (maxPanels === 2) {
    // Show rightmost 2 panels
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

  return (
    <Box className={css.wrapper} ref={containerRef}>
      <Box className={css.container}>
        {/* Panel 1 - Scripts List */}
        {visiblePanel1 && (
          <>
            <Box
              className={visiblePanel2 || visiblePanel3 ? css.panel : css.flexPanel}
              style={
                visiblePanel2 || visiblePanel3
                  ? { width: panel1.width, minWidth: panel1.width }
                  : undefined
              }
              ref={visiblePanel2 || visiblePanel3 ? panel1.panelRef : undefined}
            >
              <FilesPage scripts showHeader />
            </Box>
            {(visiblePanel2 || visiblePanel3) && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={panel1.onDown}>
                  <Box className={panel1.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Panel 2 - Script Summary with runs list */}
        {visiblePanel2 && (
          <>
            <Box
              className={visiblePanel3 ? css.panel : css.flexPanel}
              style={
                visiblePanel3
                  ? { width: panel2.width, minWidth: panel2.width }
                  : undefined
              }
              ref={visiblePanel3 ? panel2.panelRef : undefined}
            >
              <ScriptPage />
            </Box>
            {visiblePanel3 && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={panel2.onDown}>
                  <Box className={panel2.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Panel 3 - Detail view (edit, job detail, job device detail, or configure & run) */}
        {visiblePanel3 && (
          <Box className={css.flexPanel}>
            <Switch>
              <Route path="/script/:fileID/run" exact>
                <ScriptRunPage showClose={visiblePanel2} />
              </Route>
              <Route path="/script/:fileID/:jobID/edit" exact>
                <ScriptDetailPage showBack={!visiblePanel2} />
              </Route>
              <Route path="/script/:fileID/:jobID/:jobDeviceID" exact>
                <JobDeviceDetailPage showBack={!visiblePanel2} />
              </Route>
              <Route path="/script/:fileID/:jobID" exact>
                <JobDetailPage showBack={!visiblePanel2} />
              </Route>
            </Switch>
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
