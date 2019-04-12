import React from 'react'
import {
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core'
import { Platform } from '../../services/Platform'
import { useRoutes } from 'hookrouter'
import { NotFoundPage } from '../NotFoundPage'
import { StateProvider } from '../../store'
import { routes } from '../../routes'
import './App.css'

const theme = createMuiTheme({
  palette: {
    primary: { main: '#1699d6' },
    secondary: { main: '#034b9d' },
    error: { main: '#f45130' },
  },
})

export function App() {
  const routeResult = useRoutes(routes)
  return (
    <StateProvider>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {routeResult || <NotFoundPage />}
        <p className="center my-md gray">Platform: {Platform.environment}</p>
      </MuiThemeProvider>
    </StateProvider>
  )
}
