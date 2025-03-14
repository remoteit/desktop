import './polyfills'
import React from 'react'
import Controller from './services/Controller'
import browser from './services/browser'
import brand from '@common/brand/config.json'
import { App } from './components/App'
import { store } from './store'
import { ErrorBoundary } from './components/ErrorBoundary'
import { createRoot } from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Layout } from './components/Layout'
import heartbeat from './services/Heartbeat'
import analytics from './services/analytics'
import './initializeCommon'
import './services/Controller'

if (browser.environment() !== 'development') analytics.initialize()
document.title = `${brand.appName} Application`

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
