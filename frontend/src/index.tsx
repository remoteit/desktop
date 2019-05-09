import React from 'react'
import ReactDOM from 'react-dom'
import { AppController } from './controllers/AppController'
import * as serviceWorker from './serviceWorker'
import { Provider } from 'react-redux'
import { store } from './store'
import { socket } from './services/backend'
import './global.css'

store.dispatch.logs.addLog({
  type: 'general',
  message: 'Application starting up',
  createdAt: new Date(),
})

const events = [
  'service/error',
  'service/status',
  'service/updated',
  'service/request',
  'service/connecting',
  'service/connected',
  'service/tunnel/opened',
  'service/tunnel/closed',
  'service/disconnected',
  'service/unknown-event',
  'service/throughput',
  'service/uptime',

  // 'user/signIn',
  // 'connection/list',
  // 'service/connect',
  // 'service/disconnect',
  // 'connectd/install',
  // 'connectd/info',
]

interface ConnectLogMessage {
  type: string
  raw: string
  serviceID: string
  port: number
  error?: Error
}

events.map(event =>
  socket.on(event, (message: ConnectLogMessage) =>
    store.dispatch.logs.addLog({
      type: 'connectd',
      message: message.error || message.raw,
      data: message,
      createdAt: new Date(),
    })
  )
)

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
