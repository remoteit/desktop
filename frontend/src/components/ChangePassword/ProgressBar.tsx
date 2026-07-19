import React from 'react'
import { Box, LinearProgress, Typography } from '@mui/material'

export interface Props {
  description?: string
  value?: number
  color?: ''
}

export const ProgressBar: React.FC<Props> = ({ description, value }) => {
  return (
    <Box mt={2} mb={2}>
      <LinearProgress variant="determinate" value={value} sx={{ height: 8, borderRadius: '3px' }} color="primary" />
      {description && <Typography variant="caption">{description}</Typography>}
    </Box>
  )
}
