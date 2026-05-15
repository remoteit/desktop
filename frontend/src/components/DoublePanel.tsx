import React, { useRef, useState, useEffect, useCallback } from 'react'
import { getPanelWidthDefault, usePanelWidth } from '../hooks/usePanelWidth'
import { usePanelDrag } from '../hooks/usePanelDrag'
import { REGEX_FIRST_PATH } from '../constants'
import { useLocation } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { Header } from './Header'
import classnames from 'classnames'

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
  const secondaryMinWidth = getPanelWidthDefault(routeKey)
  const primaryRef = useRef<HTMLDivElement>(null)
  const [parentWidth, setParentWidth] = useState<number | undefined>()
  const css = useStyles({ layout })

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

  return (
    <>
      <div className={classnames(css.panel, css.primary)} style={{ minWidth: drag.width, width: drag.width }} ref={primaryRef}>
        {header && <Header panels={2} />}
        {left}
      </div>
      <div className={css.anchor}>
        <div className={css.handle} onMouseDown={drag.onDown}>
          <div className={drag.grab ? 'active' : undefined} />
        </div>
      </div>
      <div
        className={classnames(css.panel, css.secondary, 'drag-region')}
        style={{ minWidth: parentWidth ? Math.max(parentWidth - drag.width, secondaryMinWidth) : secondaryMinWidth }}
      >
        {right}
      </div>
    </>
  )
}

type StyleProps = {
  layout: ILayout
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  panel: ({ layout }: StyleProps) => ({
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    contain: 'content',
    // for iOS mobile
    paddingTop: layout.insets?.topPx,
    paddingBottom: layout.showBottomMenu ? 0 : layout.insets?.bottomPx,
  }),
  primary: ({ layout }: StyleProps) => ({
    // for iOS mobile
    paddingLeft: layout.hideSidebar ? layout.insets?.leftPx : 0,
  }),
  secondary: ({ layout }: StyleProps) => ({
    flexGrow: 1,
    flexShrink: 10,
    paddingTop: spacing(3),
    // for iOS mobile
    paddingRight: layout.insets?.rightPx,
  }),
  anchor: {
    position: 'relative',
    height: '100%',
  },
  handle: {
    zIndex: 8,
    position: 'absolute',
    height: '100%',
    marginLeft: -5,
    padding: `0 ${spacing(0.375)}px`,
    WebkitAppRegion: 'no-drag',
    '&:hover': {
      cursor: 'col-resize',
    },
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
