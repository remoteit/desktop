import React from 'react'
import { Box } from '@mui/material'
import { CoBrandingLogo } from '../CoBrandingLogo'
import { Logo } from '../Logo'

export function SplashScreen(): JSX.Element {
  return (
    <Box alignItems="center" display="flex" justifyContent="center" flexDirection="column">
      <Box width="140px">
        <CoBrandingLogo />
      </Box>
      <Logo width="140px" />
    </Box>
  )
}
