import React, { useEffect } from 'react'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { AdminPartnersListPage } from './AdminPartnersListPage'
import { AdminPartnerDetailPanel } from './AdminPartnerDetailPanel'
import { State } from '../../store'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { useResizablePanel } from '../../hooks/useResizablePanel'

const MIN_WIDTH = 250
const TWO_PANEL_WIDTH = 700
const DEFAULT_LEFT_WIDTH = 350

export const AdminPartnersPage: React.FC = () => {
  const { partnerId } = useParams<{ partnerId?: string }>()
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()
  const layout = useSelector((state: State) => state.ui.layout)
  const defaultSelection = useSelector((state: State) => state.ui.defaultSelection)
  
  const { containerRef, containerWidth } = useContainerWidth()
  const leftPanel = useResizablePanel(DEFAULT_LEFT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
    maxWidthConstraint: containerWidth - MIN_WIDTH,
  })

  const maxPanels = layout.singlePanel ? 1 : (containerWidth >= TWO_PANEL_WIDTH ? 2 : 1)

  // Restore previously selected partner if navigating to /admin/partners without a partnerId
  useEffect(() => {
    const adminSelection = defaultSelection['admin']
    const savedRoute = adminSelection?.['/admin/partners']
    if (location.pathname === '/admin/partners' && savedRoute) {
      history.replace(savedRoute)
    }
  }, [location.pathname, defaultSelection])

  const hasPartnerSelected = !!partnerId
  const showLeft = !hasPartnerSelected || maxPanels >= 2
  const showRight = hasPartnerSelected

  return (
    <Box className={css.wrapper} ref={containerRef}>
      <Box className={css.container}>
        {showLeft && (
          <>
            <Box 
              className={css.panel} 
              style={{ 
                width: hasPartnerSelected ? leftPanel.width : undefined,
                minWidth: hasPartnerSelected ? leftPanel.width : undefined,
                flex: hasPartnerSelected ? undefined : 1
              }} 
              ref={leftPanel.panelRef}
            >
              <AdminPartnersListPage />
            </Box>
            
            {hasPartnerSelected && (
              <Box className={css.anchor}>
                <Box className={css.handle} onMouseDown={leftPanel.onDown}>
                  <Box className={leftPanel.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}
        
        {showRight && (
          <Box className={css.rightPanel}>
            <AdminPartnerDetailPanel />
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
  rightPanel: {
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

