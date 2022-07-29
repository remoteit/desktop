import React from 'react'
import { CssBaseline, Theme, ThemeProvider } from '@mui/material'
// import { I18nextProvider } from 'react-i18next'
import { HashRouter } from 'react-router-dom'
// import theme from '../../styles/theme'
// import i18n from '../../i18n'

export type WrapperProps = {
  themeOverride?: Theme
  children: React.ReactNode
}

export function Wrapper({ children, themeOverride }: WrapperProps): JSX.Element {
  // const thisTheme = themeOverride ? themeOverride : theme

  return (
    // <I18nextProvider i18n={i18n}>
    <HashRouter>
      {/* <ThemeProvider theme={thisTheme}> */}
      {/* <CssBaseline /> */}
      {children}
      {/* </ThemeProvider> */}
    </HashRouter>
    // </I18nextProvider>
  )
}
