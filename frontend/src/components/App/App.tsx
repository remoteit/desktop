import React from 'react'
import {
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core'
import { SignIn } from '../SignIn'
import { Platform } from '../../services/Platform'
import { useRoutes } from 'hookrouter'
import { NotFoundPage } from '../NotFoundPage'
import { SplashScreenPage } from '../SplashScreenPage'
import { StateProvider } from '../../store'
import './App.css'

const routes = {
  '/': () => <SplashScreenPage />,
  '/sign-in': () => <SignIn />,
  // '/products': () => <DevicePage />,
  // '/products/:id': ({id}) => <ProductDetails id={id} />
}

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
        <p className="center my-md gray">Platform: {Platform.environment}</p>
        {routeResult || <NotFoundPage />}
      </MuiThemeProvider>
    </StateProvider>
  )
}
