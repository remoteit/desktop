import React from 'react'
import ReactDOM from 'react-dom'
import { AppController } from './controllers/AppController'
import * as serviceWorker from './serviceWorker'
import { Provider } from 'react-redux'
import { store } from './store'
import * as backend from './services/backend'
import './global.css'

// Listen for any incoming connectd events from the backend and
// forward them to our logging store.
backend.recordConnectdEvents()

ReactDOM.render(
  <Provider store={store}>
    <AppController />
  </Provider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
