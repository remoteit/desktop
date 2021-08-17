import React from 'react'
import ReactDOM from 'react-dom'
import theme from './styling/theme'
import './styling/index.css'
import './styling/fonts.css'
import { ThemeProvider } from '@material-ui/core'
import { App } from './components/App'
import { HashRouter } from 'react-router-dom'
import { AuthService } from '@remote.it/services'
import { Provider } from 'react-redux'
import { store } from './store'
import { CALLBACK_URL, REACT_APP_COGNITO_CLIENT_ID } from './constants'


window.authService = new AuthService({
  cognitoClientID: REACT_APP_COGNITO_CLIENT_ID,
  redirectURL: window.location.origin + '/',
  callbackURL: CALLBACK_URL,
  signoutCallbackURL: CALLBACK_URL,
})

ReactDOM.render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <HashRouter>
          <App />
        </HashRouter>
      </ThemeProvider>,
    </Provider>,
    document.getElementById('root')
  )
