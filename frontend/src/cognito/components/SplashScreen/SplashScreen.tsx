import React from 'react'
import { Box } from '@mui/material'
import { CoBrandingLogo } from '../CoBrandingLogo'
import { spacing } from '../../../styling'
import { Logo } from '../../../components/Logo'

export function SplashScreen(): JSX.Element {
  return (
    <>
      <Box width={140} position="absolute" top={spacing.lg}>
        <CoBrandingLogo />
      </Box>
      <Logo width={140} />
    </>
  )
}
