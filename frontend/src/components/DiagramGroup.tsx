import React, { useContext } from 'react'
import { DiagramContext } from '../services/Context'
import { alpha, Box, Paper, PaperProps, Tooltip, InputLabel } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'

export type DiagramGroupType = 'target' | 'initiator' | 'tunnel' | 'forward' | 'proxy'

type Props = {
  disabled?: boolean
  type?: DiagramGroupType
  children?: React.ReactNode
}

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramGroup: React.FC<Props> = ({ disabled, type, children }) => {
  const { activeTypes, selectedTypes, state } = useContext(DiagramContext)
  const selected = type ? selectedTypes.includes(type) : false
  const active = type ? activeTypes.includes(type) : false
  const css = useStyles()

  let tooltip = ''
  let titleColor: string | undefined = undefined
  let sx: PaperProps['sx'] = {
    flexGrow: 1,
    paddingBottom: 2,
    paddingTop: 4,
    position: 'relative',
    backgroundColor: 'transparent',
  }

  switch (state) {
    case 'connected':
      titleColor = 'primary.main'
      break
  }

  switch (type) {
    case 'proxy':
      tooltip = 'Cloud proxy initiator'
      sx.backgroundColor = 'grayLightest.main'
      sx.maxWidth = 80
      break
    case 'tunnel':
      tooltip = 'Remote.It Secure tunnel'
      break
    case 'forward':
      tooltip = 'System running the remoteit agent'
      sx.maxWidth = 80
      sx.backgroundColor = 'grayLightest.main'
      break
    case 'initiator':
      tooltip = 'This system'
      sx.paddingLeft = 1
      sx.maxWidth = 100
      sx.backgroundColor = 'grayLightest.main'
      break
    case 'target':
      tooltip = 'System hosting the service'
      sx.maxWidth = 100
      sx.backgroundColor = 'grayLightest.main'
      sx.paddingRight = 1.5
  }

  if (active) {
    sx.backgroundColor = 'primaryHighlight.main'
    titleColor = 'primary.main'
  }

  if (selected) {
    sx.backgroundColor = 'primary.main'
    titleColor = 'alwaysWhite.main'
  }

  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <Paper sx={sx} elevation={0}>
        <InputLabel
          shrink
          sx={{
            position: 'absolute',
            top: spacing.sm,
            left: spacing.md,
            color: titleColor,
          }}
        >
          {type}
        </InputLabel>
        <Box
          sx={{
            opacity: disabled ? 0.5 : 1,
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'stretch',
          }}
        >
          {children}
        </Box>
      </Paper>
    </Tooltip>
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
