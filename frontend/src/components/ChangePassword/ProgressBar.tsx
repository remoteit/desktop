import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, LinearProgress, Typography } from '@mui/material'

export interface Props {
  description?: string
  value?: number
  color?: ''
}

export const ProgressBar: React.FC<Props> = ({ description, value }) => {
  const css = useStyles()

  return (
    <Box mt={4} mb={2}>
      <LinearProgress variant="determinate" value={value} className={css.progress} color="primary"></LinearProgress>
      {description && <Typography variant="body2">{description}</Typography>}
    </Box>
  )
}

const useStyles = makeStyles({
  progress: {
    height: 8,
    borderRadius: 3,
  },
})
