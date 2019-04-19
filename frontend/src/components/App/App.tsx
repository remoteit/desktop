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
import { SplashScreenPage } from '../SplashScreenPage'

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
        <SplashScreenPage />
        {/*routeResult || <NotFoundPage />*/}
        <p className="txt-sm center my-md gray-lighter">
          Platform: {Platform.environment}
        </p>
      </MuiThemeProvider>
    </StateProvider>
  )
}
