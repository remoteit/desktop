import React from 'react'
import { Box } from '@mui/material'
import { spacing } from '../styling'

export const Overlay: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      component="section"
      sx={theme => ({
        backgroundColor: theme.palette.white.main,
        padding: `${spacing.md}px`,
        paddingBottom: '10%',
        position: 'fixed',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        display: 'flex',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
      })}
    >
      {children}
    </Box>
  )
}
