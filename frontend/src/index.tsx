import React from 'react'
import ReactDOM from 'react-dom'
import Controller from './services/Controller'
import { CssBaseline } from '@material-ui/core'
import { App } from './components/App'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import heartbeat from './services/Heartbeat'
import analyticsHelper from './helpers/analyticsHelper'
import * as serviceWorker from './serviceWorker'
import './services/Controller'
import './styling/index.css'
import './styling/fonts.css'
import { Layout } from './components/Layout'
import MemoryStats from 'react-memorystats'

const showStats = window.location.search === '?stats'

analyticsHelper.setup()

ReactDOM.render(
  <Provider store={store}>
    <Layout>
      <CssBaseline />
      <HashRouter>
        <App />
        {showStats && <MemoryStats corner="bottomLeft" />}
      </HashRouter>
    </Layout>
  </Provider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
heartbeat.init()
Controller.init()
