import React, { useRef, useCallback } from 'react'
import { usePanelWidth } from '../hooks/usePanelWidth'
import { usePanelDrag } from '../hooks/usePanelDrag'
import { Box, Theme } from '@mui/material'
import { Header } from './Header'

const handleSx = (theme: Theme) => ({
  zIndex: 8,
  position: 'absolute' as const,
  height: '100%',
  marginLeft: '-5px',
  padding: `0 ${theme.spacing(0.375)}`,
  WebkitAppRegion: 'no-drag',
  '&:hover': {
    cursor: 'col-resize',
  },
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

type Props = {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
  layout: ILayout
  header?: boolean
}

const MIN_WIDTH = 250
const PADDING = 9

export const TriplePanel: React.FC<Props> = ({ left, center, right, layout, header = true }) => {
  const [primaryPanelWidth, setPrimaryPanelWidth] = usePanelWidth('primary')
  const [secondaryPanelWidth, setSecondaryPanelWidth] = usePanelWidth('secondary')
  const primaryRef = useRef<HTMLDivElement>(null)
  const secondaryRef = useRef<HTMLDivElement>(null)

  const panelSx = {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    contain: 'content',
    // for iOS mobile
    paddingTop: layout.insets?.topPx,
    paddingBottom: layout.showBottomMenu ? 0 : layout.insets?.bottomPx,
  } as const

  const sidePanelWidth = layout.sidePanelWidth + PADDING

  const getPrimaryMaxWidth = useCallback(
    () => {
      const fullWidth = primaryRef.current?.parentElement?.offsetWidth || 1000
      const secondaryWidth = secondaryRef.current?.offsetWidth || MIN_WIDTH
      return fullWidth - secondaryWidth - MIN_WIDTH - sidePanelWidth
    },
    [sidePanelWidth]
  )

  const getSecondaryMaxWidth = useCallback(
    () => {
      const fullWidth = secondaryRef.current?.parentElement?.offsetWidth || 1000
      const primaryWidth = primaryRef.current?.offsetWidth || MIN_WIDTH
      return fullWidth - primaryWidth - MIN_WIDTH - sidePanelWidth
    },
    [sidePanelWidth]
  )

  const dragPrimary = usePanelDrag(primaryPanelWidth, {
    panelRef: primaryRef,
    minWidth: MIN_WIDTH,
    getMaxWidth: getPrimaryMaxWidth,
    onPersist: setPrimaryPanelWidth,
    layoutDep: layout,
  })

  const dragSecondary = usePanelDrag(secondaryPanelWidth, {
    panelRef: secondaryRef,
    minWidth: MIN_WIDTH,
    getMaxWidth: getSecondaryMaxWidth,
    onPersist: setSecondaryPanelWidth,
    layoutDep: layout,
  })

  return (
    <>
      <Box
        sx={[panelSx, { paddingLeft: layout.hideSidebar ? layout.insets?.leftPx : 0 }]}
        style={{ minWidth: dragPrimary.width, width: dragPrimary.width }}
        ref={primaryRef}
      >
        {header && <Header panels={3} />}
        {left}
      </Box>
      <Box sx={{ position: 'relative', height: '100%' }}>
        <Box onMouseDown={dragPrimary.onDown} sx={handleSx}>
          <div className={dragPrimary.grab ? 'active' : undefined} />
        </Box>
      </Box>
      <Box
        sx={[panelSx, { paddingTop: 3 }]}
        style={{ minWidth: dragSecondary.width, width: dragSecondary.width }}
        ref={secondaryRef}
      >
        {center}
      </Box>
      <Box sx={{ position: 'relative', height: '100%' }}>
        <Box onMouseDown={dragSecondary.onDown} sx={handleSx}>
          <div className={dragSecondary.grab ? 'active' : undefined} />
        </Box>
      </Box>
      <Box
        className="drag-region"
        sx={[panelSx, { flexGrow: 1, flexShrink: 10, paddingTop: 3, minWidth: MIN_WIDTH, paddingRight: layout.insets?.rightPx }]}
      >
        {right}
      </Box>
    </>
  )
}
