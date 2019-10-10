import React from 'react'
import ReactDOM from 'react-dom'
import { createMuiTheme } from '@material-ui/core'
import { ThemeProvider } from '@material-ui/styles'
import { App } from './components/App'
import * as serviceWorker from './serviceWorker'
import { Provider } from 'react-redux'
import { store } from './store'
import { colors, spacing } from './styling'
import './styling/index.css'
import './styling/global.css'
import './services/BackendAdapter'

const theme = createMuiTheme({
  palette: {
    primary: { main: colors.primary },
    secondary: { main: colors.secondary },
    error: { main: colors.danger },
  },
  overrides: {
    MuiFormHelperText: {
      root: { fontSize: 10, color: colors.grayLight },
    },
    MuiButton: {
      root: {
        '& .MuiSvgIcon-root': {
          marginLeft: spacing.md,
        },
        backgroundColor: colors.grayLightest,
        color: colors.grayDark,
        marginRight: spacing.lg,
        padding: `${spacing.md}px ${spacing.lg}px`,
      },
      text: {
        padding: `${spacing.md}px ${spacing.lg}px`,
      },
    },
    MuiListItem: {
      button: {
        '&:hover, &:focus': {
          backgroundColor: colors.grayLightest,
        },
      },
    },
    MuiLink: {
      root: {
        display: 'block',
        padding: `${spacing.sm}px ${spacing.sm}px`,
      },
      underlineHover: {
        '&:hover': {
          backgroundColor: colors.grayLightest,
          textDecoration: 'none',
        },
      },
    },
  },
})

ReactDOM.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </Provider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
