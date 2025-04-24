import React from 'react'
import browser from '../services/browser'
import { Box } from '@mui/material'
import { spacing } from '../styling'
import { emit } from '../services/Controller'

export const MaximizeAppRegion: React.FC = () => {
  if (!browser.isElectron || !browser.isMac) return null
  return (
    <Box
      sx={{
        left: 0,
        top: 0,
        right: 0,
        height: spacing.xxl,
        position: 'absolute',
        // WebkitAppRegion: 'drag', - handled in index.css
        // backgroundColor: 'rgba(255,0,0,0.2)',
      }}
      onDoubleClick={() => emit('maximize')}
    />
  )
}
