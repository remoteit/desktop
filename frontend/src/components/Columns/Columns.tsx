import React from 'react'
import { Box } from '@mui/material'
import { spacing } from '../../styling'

export const Columns: React.FC<{ count?: 1 | 2; inset?: boolean; center?: boolean }> = ({
  count,
  inset,
  center,
  ...props
}) => {
  return (
    <Box
      {...props}
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          alignItems: 'start',
        },
        count !== 1
          ? {
              flexDirection: 'row',
              justifyContent: 'space-between',
              '& > *:first-of-type': { flexGrow: 1 },
              '& > *:last-child': {
                paddingRight: `${spacing.xl}px`,
                paddingLeft: `${spacing.sm}px`,
              },
            }
          : {},
        inset ? { margin: `${spacing.md}px ${spacing.sm}px ${spacing.lg}px 60px` } : {},
        center ? { alignItems: 'stretch' } : {},
      ]}
    />
  )
}
