import React from 'react'
import { isMac } from '../../services/Platform'
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
  let containerStyle: any = {
    position: 'fixed',
    backgroundColor: 'var(--color-gray-lighter)',
    top: 0,
    borderRadius: 4,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  }

  if (!isMac()) {
    containerStyle = {
      ...containerStyle,
      borderColor: 'var(--color-primary)',
      borderWidth: 1,
      borderStyle: 'solid',
      boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.2)',
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="dragable" style={containerStyle}>
        {children}
      </div>
    </ThemeProvider>
  )
}
