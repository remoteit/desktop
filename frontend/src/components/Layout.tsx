import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles'
import { selectTheme } from '../styling/theme'

declare module '@mui/styles/defaultTheme' {
  interface DefaultTheme extends Theme {}
}

export interface Props {
  children: React.ReactNode
}

export const Layout = ({ children }: Props) => {
  const { themeMode } = useSelector((state: ApplicationState) => state.ui)
  const theme = selectTheme(themeMode)
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  )
}
