import './polyfills'
import React from 'react'
import Controller from './services/Controller'
import browser from './services/browser'
import brand from '@common/brand/config'
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
import './i18n'
import './initializeCommon'
import './services/Controller'
import { EMBEDDED } from './constants'
import { registerHttpBridge } from './services/thisDeviceHttp'
import { registerCapacitorBridge } from './services/thisDeviceCapacitor'

// The bridge to the machine (services/thisDevice), before anything asks for it — the sign-in asks first (models/auth
// init): a phone shell's ThisDevice plugin, or in the embedded build the menu app's, over its local server; none in a
// browser or the prod mobile app.
if (!registerCapacitorBridge() && EMBEDDED) registerHttpBridge(browser.isMobile)

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
