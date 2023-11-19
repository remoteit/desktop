import './polyfills'
import React from 'react'
import Controller from './services/Controller'
import browser from './services/Browser'
import { App } from './components/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { createRoot } from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Layout } from './components/Layout'
import { store } from './store'
import heartbeat from './services/Heartbeat'
import analytics from './services/analytics'
import './initializeCommon'
import './services/Controller'
import './styling/index.css'
import './styling/fonts.css'

if (browser.environment() !== 'development') analytics.initialize()

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

heartbeat.init()
Controller.init()
