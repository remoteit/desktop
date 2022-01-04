import React, { useState, useEffect } from 'react'
import { makeStyles } from '@material-ui/core'
import { spacing } from '../styling'
import { PinButton } from '../buttons/PinButton'
import { Body } from './Body'

export const Drawer: React.FC<{ open: boolean }> = ({ open, children }) => {
  const getWidth = () => (open ? window.document.body.offsetWidth * 0.2 : 0)
  const [width, setWidth] = useState<number>(getWidth())
  const css = useStyles(width)()

  useEffect(() => {
    setWidth(getWidth())
  }, [open])

  return (
    <div className={css.drawer}>
      {/* <div className={css.drawerHeader}>
        <Button size="small" onClick={handleClear}>
          clear
        </Button>
        <PinButton onClick={() => ui.set({ drawerMenu: false })} />
      </div> */}
      <Body className={css.body}>{children}</Body>
    </div>
  )
}

const useStyles = width =>
  makeStyles( ({ palette }) => ({
    body: {
      maxHeight: '100%',
      backgroundColor: palette.white.main,
    },
    drawer: {
      maxWidth: width,
      display: 'flex',
      alignItems: 'stretch',
      flexFlow: 'column',
      height: '100%',
      transition: 'max-width 120ms',
      '& > *': { minWidth: width },
    },
    drawerHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingRight: spacing.sm,
    },
  }))
