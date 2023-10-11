import React from 'react'
import { fontSizes } from '../styling'
import { Paper, PaperProps, Typography } from '@mui/material'

type Props = PaperProps & {
  children: React.ReactNode
}

export function CodeBlock({ children, ...props }: Props) {
  return (
    <Paper elevation={0} sx={{ marginBottom: 2, bgcolor: 'grayLightest.main', paddingX: 3, paddingY: 0.5 }} {...props}>
      <Typography
        variant="h4"
        sx={{
          fontSize: fontSizes.sm,
          color: 'grayDarker.main',
          marginTop: 2,
          marginBottom: 2,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {children}
      </Typography>
    </Paper>
  )
}
