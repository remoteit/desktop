import React, { useEffect, useRef } from 'react'
import { Switch, Route, useParams, useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { AdminUsersListPage } from './AdminUsersListPage'
import { AdminUserDetailPage } from './AdminUserDetailPage'
import { AdminUserAccountPanel } from './AdminUserAccountPanel'
import { AdminUserDevicesPanel } from './AdminUserDevicesPanel'
import { State } from '../../store'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { useResizablePanel } from '../../hooks/useResizablePanel'

const MIN_WIDTH = 250
const THREE_PANEL_WIDTH = 961
const DEFAULT_LEFT_WIDTH = 300
const DEFAULT_RIGHT_WIDTH = 350

export const AdminUsersWithDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>()
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()
  const layout = useSelector((state: State) => state.ui.layout)
  const defaultSelection = useSelector((state: State) => state.ui.defaultSelection)
  const hasRestoredRef = useRef(false)

  const { containerRef, containerWidth } = useContainerWidth()
  const leftPanel = useResizablePanel(DEFAULT_LEFT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
  })
  const rightPanel = useResizablePanel(DEFAULT_RIGHT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
  })

  const maxPanels = layout.singlePanel ? 1 : (containerWidth >= THREE_PANEL_WIDTH ? 3 : 2)

  // Restore previously selected user ONLY on initial mount
  useEffect(() => {
    if (!hasRestoredRef.current) {
      const adminSelection = defaultSelection['admin']
      const savedRoute = adminSelection?.['/admin/users']
      if (location.pathname === '/admin/users' && savedRoute) {
        history.replace(savedRoute)
      }
      hasRestoredRef.current = true
    }
  }, []) // Empty dependency array - only run once on mount

  // Redirect to /account tab if navigating directly to user without a sub-route
  useEffect(() => {
    if (userId && location.pathname === `/admin/users/${userId}`) {
      history.replace(`/admin/users/${userId}/account`)
    }
  }, [userId, location.pathname, history])

  // Only show detail panels when a user is selected
  const hasUserSelected = !!userId

  // When no user selected, show only the list (full width)
  // When user selected, show panels based on available space
  const showLeft = !hasUserSelected || maxPanels >= 3
  const showMiddle = hasUserSelected && maxPanels >= 2
  const showRight = hasUserSelected && maxPanels >= 1

  return (
    <Box className={css.wrapper} ref={containerRef}>
      <Box className={css.container}>
        {showLeft && (
          <>
            <Box
              className={css.panel}
              style={{
                width: hasUserSelected ? leftPanel.width : undefined,
                minWidth: hasUserSelected ? leftPanel.width : undefined,
                flex: hasUserSelected ? undefined : 1
              }}
              ref={leftPanel.panelRef}
            >
              <AdminUsersListPage />
            </Box>

            {hasUserSelected && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={leftPanel.onDown}>
                  <Box className={leftPanel.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {showMiddle && (
          <>
            <Box className={css.middlePanel}>
              <AdminUserDetailPage showRefresh={!showLeft} />
            </Box>

            <Box className={css.anchor}>
              <Box className={css.handle} onMouseDown={rightPanel.onDown}>
                <Box className={rightPanel.grab ? 'active' : undefined} />
              </Box>
            </Box>
          </>
        )}

        {showRight && (
          <Box
            className={css.rightPanel}
            style={showMiddle ? { width: rightPanel.width, minWidth: rightPanel.width } : undefined}
          >
            <Switch>
              <Route path="/admin/users/:userId/account">
                <AdminUserAccountPanel />
              </Route>
              <Route path="/admin/users/:userId/devices">
                <AdminUserDevicesPanel />
              </Route>
              <Route path="/admin/users/:userId" exact>
                {!showMiddle && <AdminUserDetailPage showRefresh />}
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
  middlePanel: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minWidth: MIN_WIDTH,
    paddingLeft: 8,
    paddingRight: 8,
  },
  rightPanel: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    flex: 1,
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
