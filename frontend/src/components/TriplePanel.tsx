import React, { useRef, useCallback } from 'react'
import { usePanelWidth } from '../hooks/usePanelWidth'
import { usePanelDrag } from '../hooks/usePanelDrag'
import { Box } from '@mui/material'
import { Header } from './Header'
import { PanelHandle } from './PanelHandle'

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

  const getPrimaryMaxWidth = useCallback(() => {
    const fullWidth = primaryRef.current?.parentElement?.offsetWidth || 1000
    const secondaryWidth = secondaryRef.current?.offsetWidth || MIN_WIDTH
    // Never below the minimum: a max < min makes usePanelDrag oscillate and
    // emit negative widths when reserved chrome exceeds the window
    return Math.max(MIN_WIDTH, fullWidth - secondaryWidth - MIN_WIDTH - sidePanelWidth)
  }, [sidePanelWidth])

  const getSecondaryMaxWidth = useCallback(() => {
    const fullWidth = secondaryRef.current?.parentElement?.offsetWidth || 1000
    const primaryWidth = primaryRef.current?.offsetWidth || MIN_WIDTH
    return Math.max(MIN_WIDTH, fullWidth - primaryWidth - MIN_WIDTH - sidePanelWidth)
  }, [sidePanelWidth])

  const dragPrimary = usePanelDrag(primaryPanelWidth, {
    minWidth: MIN_WIDTH,
    getMaxWidth: getPrimaryMaxWidth,
    onPersist: setPrimaryPanelWidth,
    layoutDep: layout,
  })

  const dragSecondary = usePanelDrag(secondaryPanelWidth, {
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
        <PanelHandle onMouseDown={dragPrimary.onDown} grab={dragPrimary.grab} />
      </Box>
      <Box
        sx={[panelSx, { paddingTop: 3 }]}
        style={{ minWidth: dragSecondary.width, width: dragSecondary.width }}
        ref={secondaryRef}
      >
        {center}
      </Box>
      <Box sx={{ position: 'relative', height: '100%' }}>
        <PanelHandle onMouseDown={dragSecondary.onDown} grab={dragSecondary.grab} />
      </Box>
      <Box
        className="drag-region"
        sx={[
          panelSx,
          { flexGrow: 1, flexShrink: 10, paddingTop: 3, minWidth: MIN_WIDTH, paddingRight: layout.insets?.rightPx },
        ]}
      >
        {right}
      </Box>
    </>
  )
}
