import React from 'react'
import { Typography, Box } from '@mui/material'
import { spacing } from '../styling'
import { Icon } from './Icon'

type Props = {
  message: string | React.ReactNode
}

export const EmptyMessage: React.FC<Props> = ({ message }) => {
  return (
    <Box
      sx={{
        backgroundColor: 'grayLightest.main',
        borderRadius: `${spacing.md}px`,
        padding: `${spacing.xl}px`,
        '& svg': { marginBottom: `${spacing.md}px` },
      }}
    >
      <Icon name="mouse-pointer" type="solid" size="lg" />
      <Typography variant="body2" color="grayDark.main">
        {message}
      </Typography>
    </Box>
  )
}
