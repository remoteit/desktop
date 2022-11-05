import React from 'react'
import { Box, Paper, PaperProps, InputLabel } from '@mui/material'
import { spacing } from '../styling'

export type DiagramGroupType = 'target' | 'initiator' | 'tunnel'

type Props = {
  active?: boolean
  type?: DiagramGroupType
  children?: React.ReactNode
}

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramGroup: React.FC<Props> = ({ active, type, children }) => {
  let sx: PaperProps['sx'] = {
    flexGrow: 1,
    paddingBottom: 2,
    paddingLeft: type === 'initiator' ? 1 : undefined,
    paddingRight: type === 'target' ? 1.5 : undefined,
    paddingTop: 4,
    position: 'relative',
  }

  switch (type) {
    case 'tunnel':
      break
    case 'initiator':
    case 'target':
      sx.maxWidth = 100
      sx.backgroundColor = 'grayLightest.main'
  }

  if (active) {
    sx.backgroundColor = 'primaryHighlight.main'
  }

  return (
    <Paper sx={sx} elevation={0}>
      <InputLabel
        shrink
        sx={{
          position: 'absolute',
          top: spacing.sm,
          left: spacing.md,
          color: active ? 'grayDarkest.main' : undefined,
        }}
      >
        {type}
      </InputLabel>
      <Box
        sx={{
          opacity: active ? 1 : 0.5,
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'stretch',
        }}
      >
        {children}
      </Box>
    </Paper>
  )
}
