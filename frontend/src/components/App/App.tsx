import React from 'react'
import {
  CssBaseline,
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core'
import { SignIn } from '../SignIn'
import './App.css'
import { Platform } from '../../services/Platform'
import { useRoutes } from 'hookrouter'
import { NotFoundPage } from '../NotFoundPage'

const routes = {
  // '/': () => <HomePage />,
  '/sign-in': () => <SignIn />,
  // '/products': () => <ProductOverview />,
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
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <h1>Platform: {Platform.environment}</h1>
      {routeResult || <NotFoundPage />}
    </MuiThemeProvider>
  )
}
