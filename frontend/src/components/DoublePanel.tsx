import React, { useRef, useCallback } from 'react'
import { getPanelWidthDefault, usePanelWidth } from '../hooks/usePanelWidth'
import { usePanelDrag } from '../hooks/usePanelDrag'
import { REGEX_FIRST_PATH } from '../constants'
import { useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import { Header } from './Header'
import { PanelHandle } from './PanelHandle'

type Props = {
  left: React.ReactNode
  right?: React.ReactNode
  layout: ILayout
  header?: boolean
}

const MIN_WIDTH = 250
const PADDING = 9

export const DoublePanel: React.FC<Props> = ({ left, right, layout, header = true }) => {
  const [panelWidth, setPanelWidth] = usePanelWidth()
  const location = useLocation()
  const routeKey = location.pathname.match(REGEX_FIRST_PATH)?.[0].substring(1) || ''
  const secondaryDefaultWidth = getPanelWidthDefault(routeKey, undefined, MIN_WIDTH)
  const primaryRef = useRef<HTMLDivElement>(null)

  const sidePanelWidth = layout.sidePanelWidth + PADDING

  const getMaxWidth = useCallback(() => {
    const fullWidth = primaryRef.current?.parentElement?.offsetWidth || 1000
    // Never below the minimum: a max < min makes usePanelDrag oscillate and
    // emit negative widths when reserved chrome exceeds the window
    return Math.max(MIN_WIDTH, fullWidth - secondaryDefaultWidth - sidePanelWidth)
  }, [secondaryDefaultWidth, sidePanelWidth])

  const drag = usePanelDrag(panelWidth, {
    minWidth: MIN_WIDTH,
    getMaxWidth,
    onPersist: setPanelWidth,
    layoutDep: layout,
  })

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

  return (
    <>
      <Box
        sx={[panelSx, { paddingLeft: layout.hideSidebar ? layout.insets?.leftPx : 0 }]}
        style={{ minWidth: drag.width, width: drag.width }}
        ref={primaryRef}
      >
        {header && <Header panels={2} />}
        {left}
      </Box>
      <Box sx={{ position: 'relative', height: '100%' }}>
        <PanelHandle onMouseDown={drag.onDown} grab={drag.grab} />
      </Box>
      <Box
        className="drag-region"
        sx={[panelSx, { flex: 1, minWidth: MIN_WIDTH, paddingTop: 3, paddingRight: layout.insets?.rightPx }]}
      >
        {right}
      </Box>
    </>
  )
}
