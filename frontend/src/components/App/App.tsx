import React, { useEffect } from 'react'
import {
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core'
import { Platform } from '../../services/Platform'
import { useRoutes, navigate } from 'hookrouter'
import { NotFoundPage } from '../../components/NotFoundPage'
import { useStore } from '../../store'
import { routes } from '../../routes'
import { User } from '../../models/User'
import { actions } from '../../actions'
import './App.css'
import { LoadingMessage } from '../LoadingMessage'

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

export function App() {
  const routeResult = useRoutes(routes)
  const [{ auth }, dispatch] = useStore()

  useEffect(() => {
    async function loginStart() {
      dispatch({ type: actions.auth.loginStart })

      const user = await User.loginStart()

      // Do nothing if we didn't get a user back
      if (!user) return

      // Store user info and send them to the homepage
      dispatch({ type: actions.auth.login, user })
      dispatch({ type: actions.auth.loginStopped })
      // navigate('/', true)
    }
    loginStart()
  }, [])

  // TODO: redirect user to sign in if not logged in
  // TODO: redirect user to device list if logged in and on /sign-in page
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {auth.loginStarted ? (
        <LoadingMessage message="Loading awesome!" />
      ) : (
        routeResult || <NotFoundPage />
      )}
      <p className="txt-sm center my-md gray-lighter">
        Platform: {Platform.environment}
      </p>
    </MuiThemeProvider>
  )
}
