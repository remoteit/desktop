import React from 'react'
import { makeStyles } from '@material-ui/core'
import { spacing } from '../styling'

export const Overlay: React.FC = ({ children }) => {
  const css = useStyles()
  return <section className={css.overlay}>{children}</section>
}

const useStyles = makeStyles( ({ palette }) => ({
  overlay: {
    backgroundColor: palette.white.main,
    padding: spacing.md,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    display: 'flex',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
}))
