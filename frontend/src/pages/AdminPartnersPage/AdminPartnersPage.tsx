import React, { useEffect, useRef } from 'react'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box } from '@mui/material'
import { AdminPartnersListPage } from './AdminPartnersListPage'
import { AdminPartnerDetailPanel } from './AdminPartnerDetailPanel'
import { State, Dispatch } from '../../store'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { useResizablePanel } from '../../hooks/useResizablePanel'

const MIN_WIDTH = 250
const TWO_PANEL_WIDTH = 700
const DEFAULT_LEFT_WIDTH = 350

const panelSx = {
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
} as const

const handleSx = (theme: import('@mui/material').Theme) => ({
  zIndex: 8,
  position: 'absolute',
  height: '100%',
  marginLeft: '-5px',
  padding: '0 3px',
  cursor: 'col-resize',
  '& > div': {
    width: '1px',
    marginLeft: '1px',
    marginRight: '1px',
    height: '100%',
    backgroundColor: theme.palette.grayLighter.main,
    transition: 'background-color 100ms 200ms, width 100ms 200ms, margin 100ms 200ms',
  },
  '&:hover > div, & .active': {
    width: '3px',
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: theme.palette.primary.main,
  },
})

export const AdminPartnersPage: React.FC = () => {
  const { partnerId } = useParams<{ partnerId?: string }>()
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const layout = useSelector((state: State) => state.ui.layout)
  const defaultSelection = useSelector((state: State) => state.ui.defaultSelection)
  const hasRestoredRef = useRef(false)

  const { containerRef, containerWidth } = useContainerWidth()
  const leftPanel = useResizablePanel(DEFAULT_LEFT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
    maxWidthConstraint: containerWidth - MIN_WIDTH,
  })

  const maxPanels = layout.singlePanel ? 1 : (containerWidth >= TWO_PANEL_WIDTH ? 2 : 1)

  // Restore previously selected partner ONLY on initial mount
  useEffect(() => {
    if (!hasRestoredRef.current) {
      const adminSelection = defaultSelection['admin']
      const savedRoute = adminSelection?.['/admin/partners']
      if (location.pathname === '/admin/partners' && savedRoute) {
        history.replace(savedRoute)
      }
      hasRestoredRef.current = true
    }
  }, []) // Empty dependency array - only run once on mount

  // Persist explicit navigation back to the partners list
  useEffect(() => {
    if (location.pathname === '/admin/partners') {
      dispatch.ui.setDefaultSelected({ key: '/admin/partners', value: '/admin/partners', accountId: 'admin' })
    }
  }, [location.pathname, dispatch])

  const hasPartnerSelected = !!partnerId
  const showLeft = !hasPartnerSelected || maxPanels >= 2
  const showRight = hasPartnerSelected

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }} ref={containerRef}>
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
        {showLeft && (
          <>
            <Box
              sx={panelSx}
              style={{
                width: hasPartnerSelected ? leftPanel.width : undefined,
                minWidth: hasPartnerSelected ? leftPanel.width : undefined,
                flex: hasPartnerSelected ? undefined : 1,
              }}
              ref={leftPanel.panelRef}
            >
              <AdminPartnersListPage />
            </Box>

            {hasPartnerSelected && (
              <Box sx={{ position: 'relative', height: '100%' }}>
                <Box sx={handleSx} onMouseDown={leftPanel.onDown}>
                  <Box className={leftPanel.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {showRight && (
          <Box
            sx={{
              flex: 1,
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minWidth: MIN_WIDTH,
            }}
          >
            <AdminPartnerDetailPanel />
          </Box>
        )}
      </Box>
    </Box>
  )
}
