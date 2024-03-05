import React, { useEffect } from 'react'
import browser from '../services/Browser'
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

  useEffect(() => {
    if (!browser.isElectron) return

    const body = document.body
    if (open) body.classList.add('body-no-drag')
    else body.classList.remove('body-no-drag')

    return () => {
      body.classList.remove('body-no-drag')
    }
  }, [open])

  return (
    <ClickAwayListener
      onClickAway={event => {
        if (open) {
          event.preventDefault()
          ui.set({ drawerMenu: null })
        }
      }}
    >
      <Box
        sx={{
          maxWidth: width,
          display: 'flex',
          alignItems: 'stretch',
          flexFlow: 'column',
          height: '100%',
          transition: 'max-width 200ms',
          paddingTop: radius.lg / 2 + 'px',
          borderStyle: 'solid',
          borderColor: 'grayLighter.main',
          borderWidth: width ? 1 : 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          borderTopLeftRadius: radius.lg,
          '& > *': { minWidth: width },
        }}
      >
        <Body className={css.body}>{children}</Body>
      </Box>
    </ClickAwayListener>
  )
}

const useStyles = makeStyles({
  body: { maxHeight: '100%' },
})
