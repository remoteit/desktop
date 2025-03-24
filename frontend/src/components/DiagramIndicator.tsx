import React from 'react'
import { Paper } from '@mui/material'
import { Icon } from './Icon'

export type IndicatorProps = {
  color?: Color
  placement?: 'left' | 'right'
  hide?: boolean
}

const GUTTERS = 24
const SIZE = 32

export const DiagramIndicator: React.FC<IndicatorProps> = ({ color, placement, hide }) => {
  if (hide) return null

  return (
    <Paper
      elevation={4}
      sx={{
        bottom: -SIZE,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        left: placement === 'right' ? undefined : GUTTERS,
        right: placement === 'right' ? GUTTERS : undefined,
        backgroundColor: color + '.main',
        borderRadius: '50%',
        height: SIZE,
        width: SIZE,
      }}
    >
      <Icon name="arrow-up" fontSize={16} type="solid" color="alwaysWhite" fixedWidth />
    </Paper>
  )
}