import React from 'react'
import { makeStyles } from '@material-ui/core'
import { colors, spacing } from '../styling'
import { Header } from './Header'
// import { Body } from './Body'

type Props = {
  primary?: boolean
  secondary?: boolean
}

export const Panel: React.FC<Props> = ({ primary, secondary, children }) => {
  const [width, setWidth] = React.useState<number>(400)
  const [grab, setGrab] = React.useState<boolean>(false)
  const css = useStyles()

  const onMove = event => grab && setWidth(width - event.movementX * 2)
  const onDown = () => setGrab(true)
  const onUp = () => setGrab(false)

  React.useEffect(() => {
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return function cleanup() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  })

  return (
    <>
      {secondary && (
        <div className={css.handle} onMouseDown={onDown}>
          <div className={grab ? 'active' : undefined} />
        </div>
      )}
      <div className={css.panel} style={{ width }}>
        {primary && <Header />}
        {children}
      </div>
    </>
  )
}

const useStyles = makeStyles({
  panel: {
    flexGrow: 1,
  },
  handle: {
    height: '100%',
    padding: `${0} ${spacing.sm}px`,
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
