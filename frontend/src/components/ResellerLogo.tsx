import React from 'react'
import { Box, BoxProps } from '@mui/material'

type Props = BoxProps & {
  reseller?: IResellerRef | null
}

export const ResellerLogo = ({ reseller, ...props }: Props) =>
  reseller?.logoUrl ? (
    <Box marginX={3} marginY={2} {...props}>
      <img src={reseller.logoUrl} alt="No logo uploaded" style={{ maxWidth: '140px', maxHeight: '50px' }} />
    </Box>
  ) : null
