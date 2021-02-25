import React, { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles } from '@material-ui/core'
import { colors, spacing } from '../styling'
import { Header } from './Header'

type Props = {
  primary?: boolean
  resize?: 'devices' | 'connections'
}

const MIN_WIDTH = 400

export const Panel: React.FC<Props> = ({ primary, resize, children }) => {
  const { ui } = useDispatch<Dispatch>()
  const savedWidth = useSelector((state: ApplicationState) => state.ui[`${resize}PanelWidth`])
  const handleRef = useRef<number>(savedWidth)
  const panelRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(handleRef.current)
  const [grab, setGrab] = useState<boolean>(false)
  const css = useStyles(primary, resize)()

  const onMove = (event: MouseEvent) => {
    handleRef.current += event.movementX
    if (handleRef.current > MIN_WIDTH && handleRef.current < window.document.body.offsetWidth - 800) {
      setWidth(handleRef.current)
    }
  }

  const onDown = (event: React.MouseEvent) => {
    setGrab(true)
    handleRef.current = panelRef.current?.offsetWidth || width
    event.preventDefault()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onUp = (event: MouseEvent) => {
    setGrab(false)
    event.preventDefault()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    ui.set({ [`${resize}PanelWidth`]: panelRef.current?.offsetWidth || width })
  }

  return (
    <>
      <div className={css.panel} style={{ width: resize ? width : undefined }} ref={panelRef}>
        {primary && <Header />}
        {children}
      </div>
      {resize && (
        <div className={css.handle} onMouseDown={onDown}>
          <div className={grab ? 'active' : undefined} />
        </div>
      )}
    </>
  )
}

const useStyles = (primary, resize) =>
  makeStyles({
    panel: {
      flexGrow: resize ? undefined : 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      marginTop: primary ? undefined : spacing.xl,
    },
    handle: {
      height: '100%',
      padding: `${0} ${spacing.xs}px`,
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
