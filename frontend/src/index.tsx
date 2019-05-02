import React from 'react'
import ReactDOM from 'react-dom'
import { AppController } from './controllers/AppController'
import * as serviceWorker from './serviceWorker'
import { StateProvider } from './store'
import { Provider } from 'react-redux'
import { store } from './store'
import './global.css'

ReactDOM.render(
  <Provider store={store}>
    <StateProvider>
      <AppController />
    </StateProvider>
  </Provider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
