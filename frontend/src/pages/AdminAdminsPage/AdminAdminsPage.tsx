import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { AdminAdminsListPage } from './AdminAdminsListPage'
import { AdminAdminDetailPanel } from './AdminAdminDetailPanel'
import { State } from '../../store'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { useResizablePanel } from '../../hooks/useResizablePanel'

const MIN_WIDTH = 250
const DEFAULT_LEFT_WIDTH = 400

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

export const AdminAdminsPage: React.FC = () => {
  const { adminId } = useParams<{ adminId?: string }>()
  const layout = useSelector((state: State) => state.ui.layout)

  const { containerRef } = useContainerWidth()
  const leftPanel = useResizablePanel(DEFAULT_LEFT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
  })

  const maxPanels = layout.singlePanel ? 1 : 2
  const hasAdminSelected = !!adminId

  const showLeft = !hasAdminSelected || maxPanels >= 2
  const showRight = hasAdminSelected

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }} ref={containerRef}>
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
        {showLeft && (
          <>
            <Box
              sx={panelSx}
              style={{
                width: hasAdminSelected ? leftPanel.width : undefined,
                minWidth: hasAdminSelected ? leftPanel.width : undefined,
                flex: hasAdminSelected ? undefined : 1,
              }}
              ref={leftPanel.panelRef}
            >
              <AdminAdminsListPage />
            </Box>

            {hasAdminSelected && (
              <Box sx={{ position: 'relative', height: '100%' }}>
                <Box sx={handleSx} onMouseDown={leftPanel.onDown}>
                  <Box className={leftPanel.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {showRight && (
          <Box sx={[panelSx, { flex: 1 }]}>
            <AdminAdminDetailPanel showBackArrow={!showLeft} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
