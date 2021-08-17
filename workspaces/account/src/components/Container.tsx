import React, { useState } from 'react'
import { Hidden, makeStyles, Toolbar } from '@material-ui/core'
import { NavBar } from './NavBar'
import { LeftMenu } from './LeftMenu'
import { spacing } from '../styling'

export const Container: React.FC = ({ children }) => {
  const css = useStyles()


  return (
    <>
      <div className={css.root}>
        <NavBar />
        <Hidden xsDown>
          <LeftMenu fullWidth={true} />
        </Hidden>
        <Hidden smUp>
          <LeftMenu fullWidth={false} />
        </Hidden>
        <div className={css.content}>
          <Toolbar />
          <Toolbar />
          {children}
        </div>
      </div>
    </>
  )
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    backgroundColor: 'white',
  },
  content : {
    flexGrow: 1,
    backgroundColor: 'white',
    paddingLeft: `${spacing.xs}%`,
    marginBottom: '4%'
  }
})

