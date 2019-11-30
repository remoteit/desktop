import React from 'react'
import ReactDOM from 'react-dom'
import BackendAdapter from './services/BackendAdapter'
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

const gutters = 28
const theme = createMuiTheme({
  palette: {
    primary: { main: colors.primary },
    secondary: { main: colors.secondary },
    error: { main: colors.danger },
  },
  typography: { fontFamily: 'Roboto, san-serif' },
  overrides: {
    MuiListItemText: { secondary: { fontSize: fontSizes.xs } },
    MuiDivider: { root: { backgroundColor: colors.grayLighter } },
    MuiFormHelperText: { root: { fontSize: 10 } },
    MuiButton: {
      root: {
        backgroundColor: colors.grayLightest,
        color: colors.grayDark,
        padding: `${spacing.sm}px ${spacing.md}px`,
        '& .MuiSvgIcon-root': { marginLeft: spacing.sm },
      },
      text: { padding: `${spacing.sm}px ${spacing.md}px` },
    },
    MuiListItem: {
      // gutters: { paddingLeft: gutters, paddingRight: gutters },
      button: {
        paddingLeft: spacing.sm,
        paddingRight: spacing.sm,
        '&:hover, &:focus': { backgroundColor: colors.grayLightest },
      },
      container: {
        '& .MuiListItemSecondaryAction-root': {},
        '&:hover, &:focus': {
          '& .MuiListItemSecondaryAction-root': { display: 'block' },
          '& .hoverHide': { display: 'none' },
        },
      },
    },
    MuiListItemSecondaryAction: { root: { right: gutters } },
    MuiListItemIcon: { root: { justifyContent: 'center' } },
    MuiCollapse: { wrapper: { padding: spacing.md } },
    MuiInput: {
      root: {
        '&.Mui-disabled': {
          color: colors.grayDarker,
          '& svg': { display: 'none' },
        },
      },
      underline: { '&.Mui-disabled:before': { borderColor: colors.grayLight } },
    },
    MuiLink: {
      root: { padding: `${spacing.xs}px ${spacing.sm}px` },
      underlineHover: {
        '&:hover': {
          backgroundColor: colors.grayLightest,
          borderRadius: 10,
          textDecoration: 'none',
          cursor: 'pointer',
        },
      },
    },
    MuiTypography: {
      h1: {
        fontSize: '1rem',
        fontWeight: 400,
        display: 'flex',
        alignItems: 'center',
        padding: `${spacing.xxs}px ${gutters}px`,
        borderBottom: `1px solid ${colors.grayLighter}`,
        minHeight: 50,
      },
      h2: {
        fontSize: '1rem',
        fontWeight: 400,
      },
      subtitle1: {
        fontSize: fontSizes.sm,
        fontFamily: 'Roboto Mono',
        color: colors.grayDark,
        padding: `${spacing.lg}px ${gutters}px 0`,
        marginLeft: spacing.xxs,
        textTransform: 'uppercase',
        letterSpacing: 3,
        fontWeight: 500,
      },
      caption: {
        fontSize: '11px',
        color: colors.grayDark,
      },
      colorTextSecondary: {
        color: colors.grayDark,
      },
    },
    MuiFilledInput: {
      root: {
        backgroundColor: colors.grayLightest,
        '&.Mui-disabled': {
          backgroundColor: colors.grayLighter,
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
BackendAdapter.init()
