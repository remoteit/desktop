import React from 'react'
import { alpha, Box, Paper, PaperProps, InputLabel } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'

export type DiagramGroupType = 'target' | 'initiator' | 'tunnel'

type Props = {
  active?: boolean
  type?: DiagramGroupType
  children?: React.ReactNode
}

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramGroup: React.FC<Props> = ({ active, type, children }) => {
  const css = useStyles()

  let sx: PaperProps['sx'] = {
    flexGrow: 1,
    paddingBottom: 2,
    paddingLeft: type === 'initiator' ? 1 : undefined,
    paddingRight: type === 'target' ? 1.5 : undefined,
    paddingTop: 4,
    position: 'relative',
    backgroundColor: 'transparent',
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
    <Paper sx={sx} elevation={0} className={active ? css.active : undefined}>
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

const useStyles = makeStyles(({ palette }) => ({
  '@keyframes active': {
    '0%': { transform: 'translateX(-100%)' },
    '50%': { transform: 'translateX(100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
  active: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: palette.primaryHighlight.main,
    WebkitMaskImage: '-webkit-radial-gradient(white, black)',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: '-50%',
      bottom: 0,
      left: '-50%',
      zIndex: -1,
      animation: '$active 3s linear infinite',
      background: `linear-gradient(110deg, transparent 20%, ${alpha(
        palette.alwaysWhite.main,
        0.8
      )} 35%, transparent 80%)`,
    },
  },
}))
