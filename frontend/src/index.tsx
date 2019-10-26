import React from 'react'
import ReactDOM from 'react-dom'
import { CssBaseline, createMuiTheme } from '@material-ui/core'
import { ThemeProvider } from '@material-ui/styles'
import { App } from './components/App'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { colors, spacing, fontSizes } from './styling'
import * as serviceWorker from './serviceWorker'
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
    MuiListItemText: {
      root: {
        // fontSize: fontSizes.base,
        // fontFamily: 'Roboto Mono',
      },
      secondary: {
        fontSize: fontSizes.xs,
      },
    },
    MuiFormHelperText: {
      root: { fontSize: 10, color: colors.grayLight },
    },
    MuiButton: {
      root: {
        '& .MuiSvgIcon-root': {
          marginLeft: spacing.sm,
        },
        backgroundColor: colors.grayLightest,
        color: colors.grayDark,
        marginRight: spacing.md,
        padding: `${spacing.sm}px ${spacing.md}px`,
      },
      text: {
        padding: `${spacing.sm}px ${spacing.md}px`,
      },
    },
    MuiListItem: {
      button: {
        paddingLeft: spacing.sm,
        paddingRight: spacing.xl,
        '&:hover, &:focus': {
          backgroundColor: colors.grayLightest,
        },
      },
    },
    MuiListItemIcon: {
      root: {
        // minWidth: 74,
        justifyContent: 'center',
      },
    },
    MuiCollapse: {
      wrapper: {
        padding: spacing.md,
      },
    },
    MuiInput: {
      underline: {
        '&.Mui-disabled:before': {
          borderCo: colors.grayLight,
        },
      },
    },
    MuiLink: {
      // root: {
      //   display: 'block',
      //   padding: `${spacing.xs}px ${spacing.xs}px`,
      // },
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
      <CssBaseline />
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </Provider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
