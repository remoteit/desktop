import React from 'react'
import {
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core'
import { SignIn } from '../SignIn'
import './App.css'

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#1699d6',
    },
    secondary: {
      main: '#034b9d',
    },
    error: {
      main: '#f45130',
    },
  },
})

export interface Props {}

export function App({ ...props }: Props) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <SignIn />
    </MuiThemeProvider>
  )
}
