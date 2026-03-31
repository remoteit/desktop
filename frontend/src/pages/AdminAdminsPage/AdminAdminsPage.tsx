import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { AdminAdminsListPage } from './AdminAdminsListPage'
import { AdminAdminDetailPanel } from './AdminAdminDetailPanel'
import { State } from '../../store'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { useResizablePanel } from '../../hooks/useResizablePanel'

const MIN_WIDTH = 250
const DEFAULT_LEFT_WIDTH = 400

export const AdminAdminsPage: React.FC = () => {
  const { adminId } = useParams<{ adminId?: string }>()
  const css = useStyles()
  const layout = useSelector((state: State) => state.ui.layout)

  const { containerRef, containerWidth } = useContainerWidth()
  const leftPanel = useResizablePanel(DEFAULT_LEFT_WIDTH, containerRef, {
    minWidth: MIN_WIDTH,
  })

  const maxPanels = layout.singlePanel ? 1 : 2
  const hasAdminSelected = !!adminId

  const showLeft = !hasAdminSelected || maxPanels >= 2
  const showRight = hasAdminSelected

  return (
    <Box className={css.wrapper} ref={containerRef}>
      <Box className={css.container}>
        {showLeft && (
          <>
            <Box
              className={css.panel}
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
            <AdminAdminDetailPanel showBackArrow={!showLeft} />
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
