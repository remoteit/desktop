import React, { useRef, useState, useEffect } from 'react'
import { spacing } from '../styling'
import { usePanelWidth } from '../hooks/usePanelWidth'
import { makeStyles } from '@mui/styles'
import { Header } from './Header'
import classnames from 'classnames'

type Props = {
  primary: React.ReactNode
  secondary?: React.ReactNode
  layout: ILayout
}

const MIN_WIDTH = 300
const PADDING = 9

export const DoublePanel: React.FC<Props> = ({ primary, secondary, layout }) => {
  const [panelWidth, setPanelWidth] = usePanelWidth()
  const handleRef = useRef<number>(panelWidth)
  const primaryRef = useRef<HTMLDivElement>(null)
  const moveRef = useRef<number>(0)
  const [width, setWidth] = useState<number>(panelWidth)
  const [parentWidth, setParentWidth] = useState<number | undefined>()
  const [grab, setGrab] = useState<boolean>(false)
  const css = useStyles()

  const sidePanelWidth = layout.sidePanelWidth + PADDING

  const onMove = (event: MouseEvent) => {
    const fullWidth = primaryRef.current?.parentElement?.offsetWidth || 1000
    handleRef.current += event.clientX - moveRef.current
    moveRef.current = event.clientX
    if (handleRef.current > MIN_WIDTH && handleRef.current < fullWidth - MIN_WIDTH - sidePanelWidth) {
      setWidth(handleRef.current)
    }
  }

  const measure = () => {
    const parent = (primaryRef.current?.parentElement?.offsetWidth || 1000) - sidePanelWidth
    setParentWidth(parent)
    if (width < MIN_WIDTH) setWidth(MIN_WIDTH)
    else if (width > parent - MIN_WIDTH) setWidth(parent - MIN_WIDTH)
  }

  const onDown = (event: React.MouseEvent) => {
    setGrab(true)
    measure()
    moveRef.current = event.clientX
    handleRef.current = primaryRef.current?.offsetWidth || width
    event.preventDefault()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onUp = (event: MouseEvent) => {
    setGrab(false)
    event.preventDefault()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    setPanelWidth(primaryRef.current?.offsetWidth || width)
  }

  useEffect(() => {
    setWidth(panelWidth)
  }, [panelWidth])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return function cleanup() {
      window.removeEventListener('resize', measure)
    }
  }, [layout])

  return (
    <>
      <div className={css.panel} style={{ minWidth: width, width }} ref={primaryRef}>
        <Header />
        {primary}
      </div>
      <div className={css.anchor}>
        <div className={css.handle} onMouseDown={onDown}>
          <div className={grab ? 'active' : undefined} />
        </div>
      </div>
      <div
        className={classnames(css.panel, css.secondary)}
        style={{ minWidth: parentWidth ? parentWidth - width : undefined }}
      >
        <div className={css.header} />
        {secondary}
      </div>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  panel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    contain: 'content',
  },
  secondary: {
    flexGrow: 1,
    flexShrink: 10,
  },
  header: {
    height: spacing.lg,
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
    padding: `0 ${spacing.xxs}px`,
    '-webkit-app-region': 'no-drag',
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
