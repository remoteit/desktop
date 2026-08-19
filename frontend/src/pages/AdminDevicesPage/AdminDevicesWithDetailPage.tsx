import { Box } from '@mui/material'
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { useResizablePanel } from '../../hooks/useResizablePanel'
import { Dispatch, State } from '../../store'
import { AdminDeviceDetailPage } from './AdminDeviceDetailPage'
import { AdminDevicesListPage } from './AdminDevicesListPage'

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

export const AdminDevicesWithDetailPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId?: string }>()
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const layout = useSelector((state: State) => state.ui.layout)
  const defaultSelection = useSelector((state: State) => state.ui.defaultSelection)
  const hasRestoredRef = useRef(false)

  const { containerRef, containerWidth } = useContainerWidth()
  const leftPanel = useResizablePanel(DEFAULT_LEFT_WIDTH, containerRef, { minWidth: MIN_WIDTH })

  // Below two panels' worth of width the detail takes over the whole area.
  const twoPanel = !layout.singlePanel && containerWidth >= MIN_WIDTH * 2

  // Restore the previously selected device ONLY on initial mount
  useEffect(() => {
    if (!hasRestoredRef.current) {
      const savedRoute = defaultSelection['admin']?.['/admin/devices']
      if (location.pathname === '/admin/devices' && savedRoute) history.replace(savedRoute)
      hasRestoredRef.current = true
    }
  }, [])

  // Persist explicit navigation back to the device list
  useEffect(() => {
    if (location.pathname === '/admin/devices') {
      dispatch.ui.setDefaultSelected({ key: '/admin/devices', value: '/admin/devices', accountId: 'admin' })
    }
  }, [location.pathname, dispatch])

  const selected = !!deviceId
  const showList = !selected || twoPanel
  const showDetail = selected

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }} ref={containerRef}>
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
        {showList && (
          <>
            <Box
              sx={panelSx}
              style={{
                width: selected ? leftPanel.width : undefined,
                minWidth: selected ? leftPanel.width : undefined,
                flex: selected ? undefined : 1,
              }}
              ref={leftPanel.panelRef}
            >
              <AdminDevicesListPage />
            </Box>

            {selected && (
              <Box sx={{ position: 'relative', height: '100%' }}>
                <Box sx={handleSx} onMouseDown={leftPanel.onDown}>
                  <Box className={leftPanel.grab ? 'active' : undefined} />
                </Box>
              </Box>
            )}
          </>
        )}

        {showDetail && (
          <Box sx={[panelSx, { flex: 1, minWidth: MIN_WIDTH }]}>
            <AdminDeviceDetailPage />
          </Box>
        )}
      </Box>
    </Box>
  )
}
