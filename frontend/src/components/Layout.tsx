import React, { useEffect, useState } from 'react'
import { createTheme, ThemeProvider } from '@material-ui/core'
import theme, { jssTheme } from '../styling/theme'


export interface Props {
  children: React.ReactNode
}

export const Layout = ({children}: Props) => {
  const [muiTheme, setMuiTheme] = useState<any>(theme)

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      console.log("DARK MODE: ", e.matches)
      const theme = createTheme(jssTheme(e.matches))
      setMuiTheme(theme)
    })
  }, [])

  return <ThemeProvider theme={muiTheme}>
    {children}
  </ThemeProvider>
}