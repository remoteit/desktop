import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { ClickAwayListener, Box } from '@mui/material'
import { radius } from '../styling'
import { Body } from './Body'

const WIDTH = 275

export const Drawer: React.FC<{ menu: string; children?: React.ReactNode }> = ({ menu, children }) => {
  const open = useSelector((state: State) => state.ui.drawerMenu === menu)
  const { ui } = useDispatch<Dispatch>()
  const width = open ? WIDTH : 0
  const css = useStyles()

  return (
    <ClickAwayListener onClickAway={() => open && ui.set({ drawerMenu: null })}>
      <Box
        sx={{
          maxWidth: width,
          display: 'flex',
          alignItems: 'stretch',
          flexFlow: 'column',
          height: '100%',
          transition: 'max-width 200ms',
          paddingTop: radius / 2 + 'px',
          borderStyle: 'solid',
          borderColor: 'grayLighter.main',
          borderWidth: width ? 1 : 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          borderTopLeftRadius: radius,
          '& > *': { minWidth: width },
        }}
      >
        <Body className={css.body}>{children}</Body>
      </Box>
    </ClickAwayListener>
  )
}

const useStyles = makeStyles({
  body: {
    maxHeight: '100%',
  },
})
