import React from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { AdminUpgradesListPage } from './AdminUpgradesListPage'
import { AdminFleetTab } from './AdminFleetTab'
import { isFleetView } from './fleetHelpers'
import { AdminRolloutDetailPanel } from './AdminRolloutDetailPanel'
import { AdminRolloutStartForm } from './AdminRolloutStartForm'
import { NEW_ROLLOUT } from './rolloutHelpers'
import { useUpgrades } from './useUpgrades'
import { State } from '../../store'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { useResizablePanel } from '../../hooks/useResizablePanel'

const MIN_WIDTH = 250
const DEFAULT_LEFT_WIDTH = 560

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

/* Device package upgrades (admin): each release channel's devices and delivery, the rollout runs that take a candidate
   up its ladder, and one run in detail with its controls; or, in its Fleet tab (?view=fleet), the fleet's versions.
   English only, as the rest of /admin. */
export const AdminUpgradesPage: React.FC = () => {
  const location = useLocation()
  return isFleetView(location.search) ? <AdminFleetTab /> : <AdminRolloutsView />
}

const AdminRolloutsView: React.FC = () => {
  const { rolloutId } = useParams<{ rolloutId?: string }>()
  const upgrades = useUpgrades()
  const layout = useSelector((state: State) => state.ui.layout)

  const { containerRef } = useContainerWidth()
  const leftPanel = useResizablePanel(DEFAULT_LEFT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
  })

  const maxPanels = layout.singlePanel ? 1 : 2
  const hasSelection = !!rolloutId

  const showLeft = !hasSelection || maxPanels >= 2
  const showRight = hasSelection

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }} ref={containerRef}>
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
        {showLeft && (
          <>
            <Box
              sx={panelSx}
              style={{
                width: hasSelection ? leftPanel.width : undefined,
                minWidth: hasSelection ? leftPanel.width : undefined,
                flex: hasSelection ? undefined : 1,
              }}
              ref={leftPanel.panelRef}
            >
              <AdminUpgradesListPage upgrades={upgrades} />
            </Box>

            {hasSelection && (
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
            {rolloutId === NEW_ROLLOUT ? (
              <AdminRolloutStartForm
                channels={Array.isArray(upgrades.channels) ? upgrades.channels : []}
                showBackArrow={!showLeft}
                onStarted={upgrades.reload}
              />
            ) : (
              <AdminRolloutDetailPanel key={rolloutId} showBackArrow={!showLeft} onChanged={upgrades.reload} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
