import React, { useEffect } from 'react'
import {
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core'
import { Platform } from '../../services/Platform'
import { useRoutes } from 'hookrouter'
import { NotFoundPage } from '../../components/NotFoundPage'
import { routes } from '../../routes'
import { LoadingMessage } from '../LoadingMessage'
import { Props } from '../../controllers/AppController/AppController'

const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    primary: { main: '#1699d6' },
    secondary: { main: '#034b9d' },
    error: { main: '#f45130' },
  },
})

export function App({ checkLogin, loginStarted = false }: Props) {
  const routeResult = useRoutes(routes)

  useEffect(() => {
    checkLogin()
  }, [])

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {loginStarted ? (
        <LoadingMessage message="Loading awesome!" />
      ) : (
        routeResult || <NotFoundPage />
      )}
      {/*<p className="txt-sm center my-md gray-lighter">
        Platform: {Platform.environment}
      </p>*/}
    </MuiThemeProvider>
  )
}
