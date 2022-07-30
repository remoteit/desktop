import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles'

declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

export interface Props {
  children: React.ReactNode
}

export const Layout = ({ children }: Props) => {
  const { theme, themeMode } = useSelector((state: ApplicationState) => state.ui)
  console.log('theme', theme, themeMode)
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  )
}
