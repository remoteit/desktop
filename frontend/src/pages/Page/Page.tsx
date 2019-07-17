import React from 'react'
import { CssBaseline, createMuiTheme } from '@material-ui/core'
import { ThemeProvider } from '@material-ui/styles'

const theme = createMuiTheme({
  palette: {
    background: {
      default: 'transparent',
    },
    primary: { main: '#1699d6' },
    // secondary: { main: '#034b9d' },
    error: { main: '#f45130' },
  },
  overrides: {
    MuiListItem: {
      button: {
        '&:hover, &:focus': {
          backgroundColor: 'var(--color-gray-lightest)',
        },
      },
    },
    MuiLink: {
      root: {
        display: 'block',
        padding: 'var(--spacing-sm) var(--spacing-md)',
      },
      underlineHover: {
        '&:hover': {
          backgroundColor: 'var(--color-gray-lightest)',
          textDecoration: 'none',
        },
      },
    },
  },
})

export interface Props {
  children: React.ReactNode
}

export function Page({ children }: Props & React.HTMLProps<HTMLDivElement>) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
