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
    <Box mt={2} mb={2}>
      <LinearProgress variant="determinate" value={value} className={css.progress} color="primary" />
      {description && <Typography variant="caption">{description}</Typography>}
    </Box>
  )
}

const useStyles = makeStyles({
  progress: {
    height: 8,
    borderRadius: 3,
  },
})
