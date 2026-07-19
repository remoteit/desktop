import React, { useRef, useState, useEffect, useCallback } from 'react'
import { getPanelWidthDefault, usePanelWidth } from '../hooks/usePanelWidth'
import { usePanelDrag } from '../hooks/usePanelDrag'
import { REGEX_FIRST_PATH } from '../constants'
import { useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import { Header } from './Header'

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
  const secondaryMinWidth = getPanelWidthDefault(routeKey, undefined, MIN_WIDTH)
  const primaryRef = useRef<HTMLDivElement>(null)
  const [parentWidth, setParentWidth] = useState<number | undefined>()

  const sidePanelWidth = layout.sidePanelWidth + PADDING

  const getMaxWidth = useCallback(
    () => {
      const fullWidth = primaryRef.current?.parentElement?.offsetWidth || 1000
      return fullWidth - secondaryMinWidth - sidePanelWidth
    },
    [secondaryMinWidth, sidePanelWidth]
  )

  const drag = usePanelDrag(panelWidth, {
    panelRef: primaryRef,
    minWidth: MIN_WIDTH,
    getMaxWidth,
    onPersist: setPanelWidth,
    layoutDep: layout,
  })

  const measureParent = useCallback(() => {
    const parent = (primaryRef.current?.parentElement?.offsetWidth || 1000) - sidePanelWidth
    setParentWidth(parent)
  }, [sidePanelWidth])

  useEffect(() => {
    measureParent()
  }, [layout, drag.width, measureParent])

  useEffect(() => {
    window.addEventListener('resize', measureParent)
    return () => window.removeEventListener('resize', measureParent)
  }, [measureParent])

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
        <Box
          onMouseDown={drag.onDown}
          sx={theme => ({
            zIndex: 8,
            position: 'absolute',
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
          })}
        >
          <div className={drag.grab ? 'active' : undefined} />
        </Box>
      </Box>
      <Box
        className="drag-region"
        sx={[panelSx, { flexGrow: 1, flexShrink: 10, paddingTop: 3, paddingRight: layout.insets?.rightPx }]}
        style={{ minWidth: parentWidth ? Math.max(parentWidth - drag.width, secondaryMinWidth) : secondaryMinWidth }}
      >
        {right}
      </Box>
    </>
  )
}
