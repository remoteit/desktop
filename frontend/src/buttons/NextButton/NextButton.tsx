import React from 'react'
import { Box } from '@mui/material'
import { Icon } from '../../components/Icon'
import { spacing } from '../../styling'

export const NextButton: React.FC = () => {
  return (
    <Box
      component="span"
      sx={{
        paddingLeft: `${spacing.md}px`,
        paddingRight: `${spacing.md}px`,
        position: 'absolute',
        right: `${spacing.md}px`,
      }}
    >
      <Icon name="chevron-right" size="md" fixedWidth />
    </Box>
  )
}
