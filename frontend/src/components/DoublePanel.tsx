import React, { useRef, useState, useEffect } from 'react'
import { colors, spacing } from '../styling'
import { usePanelWidth } from '../hooks/usePanelWidth'
import { makeStyles } from '@material-ui/core'
import { Header } from './Header'
import classnames from 'classnames'

type Props = {
  primary: React.ReactElement
  secondary?: React.ReactElement
}

const MIN_WIDTH = 320
const SIDEBAR_WIDTH = 9 + 250

export const DoublePanel: React.FC<Props> = ({ primary, secondary }) => {
  const [panelWidth, setPanelWidth] = usePanelWidth()
  const handleRef = useRef<number>(panelWidth)
  const primaryRef = useRef<HTMLDivElement>(null)
  const moveRef = useRef<number>(0)
  const [width, setWidth] = useState<number>(panelWidth)
  const [parentWidth, setParentWidth] = useState<number | undefined>()
  const [grab, setGrab] = useState<boolean>(false)
  const css = useStyles()

  const onMove = (event: MouseEvent) => {
    const fullWidth = primaryRef.current?.parentElement?.offsetWidth || 1000
    handleRef.current += event.clientX - moveRef.current
    moveRef.current = event.clientX
    if (handleRef.current > MIN_WIDTH && handleRef.current < fullWidth - MIN_WIDTH - SIDEBAR_WIDTH) {
      setWidth(handleRef.current)
    }
  }

  const measure = () => {
    const parent = (primaryRef.current?.parentElement?.offsetWidth || 1000) - SIDEBAR_WIDTH
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
  }, [])

  return (
    <>
      <div className={css.panel} style={{ minWidth: width }} ref={primaryRef}>
        <Header />
        {primary}
      </div>
      <div className={css.handle} onMouseDown={onDown}>
        <div className={grab ? 'active' : undefined} />
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

const useStyles = makeStyles({
  panel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  secondary: {
    flexGrow: 1,
    flexShrink: 10,
  },
  header: {
    height: spacing.lg,
  },
  handle: {
    height: '100%',
    padding: `${0} ${spacing.xxs}px`,
    '-webkit-app-region': 'no-drag',
    '&:hover': {
      cursor: 'col-resize',
    },
    '& > div': {
      width: 1,
      marginLeft: 1,
      marginRight: 1,
      height: '100%',
      backgroundColor: colors.grayLighter,
      transition: 'background-color 100ms 200ms, width 100ms 200ms, margin 100ms 200ms',
    },
    '&:hover > div, & .active': {
      width: 3,
      marginLeft: 0,
      marginRight: 0,
      backgroundColor: colors.primary,
    },
  },
})
