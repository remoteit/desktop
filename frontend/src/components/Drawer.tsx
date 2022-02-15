import React from 'react'
import { makeStyles } from '@material-ui/core'
import { spacing, radius } from '../styling'
import { Body } from './Body'

const WIDTH = 275

export const Drawer: React.FC<{ open: boolean }> = ({ open, children }) => {
  const css = useStyles({ width: open ? WIDTH : 0 })

  return (
    <div className={css.drawer}>
      <Body className={css.body}>{children}</Body>
    </div>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  body: {
    maxHeight: '100%',
  },
  drawer: ({ width }: { width: number }) => ({
    maxWidth: width,
    display: 'flex',
    alignItems: 'stretch',
    flexFlow: 'column',
    height: '100%',
    transition: 'max-width 120ms',
    paddingTop: radius / 2,
    borderTop: `${width ? 1 : 0}px solid ${palette.grayLighter.main}`,
    borderLeft: `${width ? 1 : 0}px solid ${palette.grayLighter.main}`,
    borderTopLeftRadius: radius,
    '& > *': { minWidth: width },
  }),
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: spacing.sm,
  },
}))
