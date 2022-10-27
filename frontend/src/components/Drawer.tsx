import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { ClickAwayListener } from '@mui/material'
import { spacing, radius } from '../styling'
import { Body } from './Body'

const WIDTH = 275

export const Drawer: React.FC<{ menu: string; children?: React.ReactNode }> = ({ menu, children }) => {
  const open = useSelector((state: ApplicationState) => state.ui.drawerMenu === menu)
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles({ width: open ? WIDTH : 0 })

  return (
    <ClickAwayListener onClickAway={() => open && ui.set({ drawerMenu: null })}>
      <div className={css.drawer}>
        <Body className={css.body}>{children}</Body>
      </div>
    </ClickAwayListener>
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
    transition: 'max-width 200ms',
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
