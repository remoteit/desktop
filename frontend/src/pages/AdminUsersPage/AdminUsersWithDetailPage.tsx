import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Switch, Route, useParams, Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { AdminUsersListPage } from './AdminUsersListPage'
import { AdminUserDetailPage } from './AdminUserDetailPage'
import { AdminUserAccountPanel } from './AdminUserAccountPanel'
import { AdminUserDevicesPanel } from './AdminUserDevicesPanel'
import { State } from '../../store'

const MIN_WIDTH = 250
const THREE_PANEL_WIDTH = 961
const DEFAULT_LEFT_WIDTH = 300
const DEFAULT_RIGHT_WIDTH = 350

export const AdminUsersWithDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>()
  const css = useStyles()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const layout = useSelector((state: State) => state.ui.layout)
  
  const [containerWidth, setContainerWidth] = useState<number>(1000)
  
  const leftPrimaryRef = useRef<HTMLDivElement>(null)
  const leftHandleRef = useRef<number>(DEFAULT_LEFT_WIDTH)
  const leftMoveRef = useRef<number>(0)
  const [leftWidth, setLeftWidth] = useState<number>(DEFAULT_LEFT_WIDTH)
  const [leftGrab, setLeftGrab] = useState<boolean>(false)

  const rightHandleRef = useRef<number>(DEFAULT_RIGHT_WIDTH)
  const rightMoveRef = useRef<number>(0)
  const [rightWidth, setRightWidth] = useState<number>(DEFAULT_RIGHT_WIDTH)
  const [rightGrab, setRightGrab] = useState<boolean>(false)

  const maxPanels = layout.singlePanel ? 1 : (containerWidth >= THREE_PANEL_WIDTH ? 3 : 2)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    
    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => resizeObserver.disconnect()
  }, [])

  const onLeftMove = useCallback((event: MouseEvent) => {
    const fullWidth = containerRef.current?.offsetWidth || 1000
    leftHandleRef.current += event.clientX - leftMoveRef.current
    leftMoveRef.current = event.clientX
    if (leftHandleRef.current > MIN_WIDTH && leftHandleRef.current < fullWidth - MIN_WIDTH - rightWidth) {
      setLeftWidth(leftHandleRef.current)
    }
  }, [rightWidth])

  const onLeftUp = useCallback((event: MouseEvent) => {
    setLeftGrab(false)
    event.preventDefault()
    window.removeEventListener('mousemove', onLeftMove)
    window.removeEventListener('mouseup', onLeftUp)
  }, [onLeftMove])

  const onLeftDown = (event: React.MouseEvent) => {
    setLeftGrab(true)
    leftMoveRef.current = event.clientX
    leftHandleRef.current = leftPrimaryRef.current?.offsetWidth || leftWidth
    event.preventDefault()
    window.addEventListener('mousemove', onLeftMove)
    window.addEventListener('mouseup', onLeftUp)
  }

  const onRightMove = useCallback((event: MouseEvent) => {
    const fullWidth = containerRef.current?.offsetWidth || 1000
    rightHandleRef.current -= event.clientX - rightMoveRef.current
    rightMoveRef.current = event.clientX
    if (rightHandleRef.current > MIN_WIDTH && rightHandleRef.current < fullWidth - MIN_WIDTH - leftWidth) {
      setRightWidth(rightHandleRef.current)
    }
  }, [leftWidth])

  const onRightUp = useCallback((event: MouseEvent) => {
    setRightGrab(false)
    event.preventDefault()
    window.removeEventListener('mousemove', onRightMove)
    window.removeEventListener('mouseup', onRightUp)
  }, [onRightMove])

  const onRightDown = (event: React.MouseEvent) => {
    setRightGrab(true)
    rightMoveRef.current = event.clientX
    rightHandleRef.current = rightWidth
    event.preventDefault()
    window.addEventListener('mousemove', onRightMove)
    window.addEventListener('mouseup', onRightUp)
  }

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
                width: hasUserSelected ? leftWidth : undefined,
                minWidth: hasUserSelected ? leftWidth : undefined,
                flex: hasUserSelected ? undefined : 1
              }} 
              ref={leftPrimaryRef}
            >
              <AdminUsersListPage />
            </Box>
            
            {hasUserSelected && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={onLeftDown}>
                  <Box className={leftGrab ? 'active' : undefined} />
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
              <Box className={css.handle} onMouseDown={onRightDown}>
                <Box className={rightGrab ? 'active' : undefined} />
              </Box>
            </Box>
          </>
        )}
        
        {showRight && (
          <Box 
            className={css.rightPanel} 
            style={showMiddle ? { width: rightWidth, minWidth: rightWidth } : undefined}
          >
            <Switch>
              <Route path="/admin/users/:userId/account">
                <AdminUserAccountPanel />
              </Route>
              <Route path="/admin/users/:userId/devices">
                <AdminUserDevicesPanel />
              </Route>
              <Route path="/admin/users/:userId" exact>
                {showMiddle ? (
                  <Redirect to={`/admin/users/${userId}/account`} />
                ) : (
                  <AdminUserDetailPage showRefresh />
                )}
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
