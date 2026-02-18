import React, { useRef, useCallback } from 'react'
import { usePanelWidth } from '../hooks/usePanelWidth'
import { usePanelDrag } from '../hooks/usePanelDrag'
import { makeStyles } from '@mui/styles'
import { Header } from './Header'
import classnames from 'classnames'

type Props = {
  primary: React.ReactNode
  secondary: React.ReactNode
  tertiary: React.ReactNode
  layout: ILayout
  header?: boolean
}

const MIN_WIDTH = 250
const PADDING = 9

export const TriplePanel: React.FC<Props> = ({ primary, secondary, tertiary, layout, header = true }) => {
  const [primaryPanelWidth, setPrimaryPanelWidth] = usePanelWidth('primary')
  const [secondaryPanelWidth, setSecondaryPanelWidth] = usePanelWidth('secondary')
  const primaryRef = useRef<HTMLDivElement>(null)
  const secondaryRef = useRef<HTMLDivElement>(null)
  const css = useStyles({ layout })

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
      <div
        className={classnames(css.panel, css.primary)}
        style={{ minWidth: dragPrimary.width, width: dragPrimary.width }}
        ref={primaryRef}
      >
        {header && <Header />}
        {primary}
      </div>
      <div className={css.anchor}>
        <div className={css.handle} onMouseDown={dragPrimary.onDown}>
          <div className={dragPrimary.grab ? 'active' : undefined} />
        </div>
      </div>
      <div
        className={classnames(css.panel, css.middle)}
        style={{ minWidth: dragSecondary.width, width: dragSecondary.width }}
        ref={secondaryRef}
      >
        {secondary}
      </div>
      <div className={css.anchor}>
        <div className={css.handle} onMouseDown={dragSecondary.onDown}>
          <div className={dragSecondary.grab ? 'active' : undefined} />
        </div>
      </div>
      <div className={classnames(css.panel, css.tertiary, 'drag-region')}>
        {tertiary}
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
  middle: () => ({
    paddingTop: spacing(3),
  }),
  tertiary: ({ layout }: StyleProps) => ({
    flexGrow: 1,
    flexShrink: 10,
    paddingTop: spacing(3),
    minWidth: MIN_WIDTH,
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
