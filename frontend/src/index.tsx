import React from 'react'
import Controller from './services/Controller'
import { App } from './components/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { environment } from './services/Browser'
import { createRoot } from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Layout } from './components/Layout'
import { store } from './store'
import heartbeat from './services/Heartbeat'
import analytics from './services/analytics'
import * as serviceWorker from './serviceWorker'
import './services/Controller'
import './styling/index.css'
import './styling/fonts.css'

if (environment() !== 'development') analytics.initialize()

const root = createRoot(document.getElementById('root')!)
root.render(
  <ErrorBoundary store={store}>
    <Provider store={store}>
      <Layout>
        <CssBaseline />
        <HashRouter>
          <App />
        </HashRouter>
      </Layout>
    </Provider>
  </ErrorBoundary>
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
heartbeat.init()
Controller.init()
