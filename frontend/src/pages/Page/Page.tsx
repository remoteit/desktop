import React from 'react'
import {
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core'
import classnames from 'classnames'
import styles from './Page.module.css'

const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    background: {
      default: 'transparent',
    },
    primary: { main: '#1699d6' },
    // secondary: { main: '#034b9d' },
    error: { main: '#f45130' },
  },
})

export interface Props {
  children: React.ReactNode
}

export function Page({
  children,
  ...props
}: Props & React.HTMLProps<HTMLDivElement>) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <div className={classnames(styles.titleBar, 'dragable')}>remote.it</div>
      {children}
    </MuiThemeProvider>
  )
}
