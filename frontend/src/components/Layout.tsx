import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { ThemeProvider } from '@material-ui/core'

export interface Props {
  children: React.ReactNode
}

export const Layout = ({ children }: Props) => {
  const theme = useSelector((state: ApplicationState) => state.ui.theme)
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
