import React from 'react'
import { Box } from '@mui/material'
import { CoBrandingLogo } from '../CoBrandingLogo'
import { spacing } from '../../../styling'
import { Logo } from '../Logo'

export function SplashScreen(): JSX.Element {
  return (
    <>
      <Box width="140px" position="absolute" top={spacing.lg}>
        <CoBrandingLogo />
      </Box>
      <Logo width="140px" />
    </>
  )
}
