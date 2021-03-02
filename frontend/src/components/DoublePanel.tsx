import React, { useRef, useState } from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { colors, spacing } from '../styling'
import { Breadcrumbs } from './Breadcrumbs'
import { makeStyles } from '@material-ui/core'
import { Header } from './Header'
import classnames from 'classnames'

type Props = {
  primary: React.ReactElement
  secondary?: React.ReactElement
  resize?: 'devices' | 'connections'
}

const MIN_WIDTH = 300

export const DoublePanel: React.FC<Props> = ({ primary, secondary, resize }) => {
  const { ui } = useDispatch<Dispatch>()
  const savedWidth = useSelector((state: ApplicationState) => state.ui[`${resize}PanelWidth`])
  const handleRef = useRef<number>(savedWidth)
  const primaryRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(handleRef.current)
  const [grab, setGrab] = useState<boolean>(false)
  const css = useStyles()

  const onMove = (event: MouseEvent) => {
    handleRef.current += event.movementX
    if (handleRef.current > MIN_WIDTH && handleRef.current < window.document.body.offsetWidth - MIN_WIDTH) {
      setWidth(handleRef.current)
    }
  }

  const onDown = (event: React.MouseEvent) => {
    setGrab(true)
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
    ui.set({ [`${resize}PanelWidth`]: primaryRef.current?.offsetWidth || width })
  }

  return (
    <>
      <div className={css.panel} style={{ width }} ref={primaryRef}>
        <Header />
        {primary}
      </div>
      <div className={css.handle} onMouseDown={onDown}>
        <div className={grab ? 'active' : undefined} />
      </div>
      <div className={classnames(css.panel, css.secondary)}>
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
    height: spacing.xl,
    // '-webkit-user-select': 'none',
    // '-webkit-app-region': 'drag',
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
