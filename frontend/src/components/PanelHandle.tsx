import React from 'react'
import { Box, Theme } from '@mui/material'

/* The app's drag divider: a hairline that thickens and takes the primary
   color on hover or while grabbed. Extracted from the panel components so
   every resizable edge — content panels and the chat column — matches. */
const handleSx = (theme: Theme) => ({
  zIndex: 8,
  position: 'absolute' as const,
  height: '100%',
  marginLeft: '-5px',
  padding: `0 ${theme.spacing(0.375)}`,
  WebkitAppRegion: 'no-drag' as const,
  '&:hover': {
    cursor: 'col-resize',
  },
  '& > div': {
    width: '1px',
    marginLeft: '1px',
    marginRight: '1px',
    height: '100%',
    backgroundColor: theme.palette.grayLighter.main,
    transition: 'background-color 100ms 200ms, width 100ms 200ms, margin 100ms 200ms',
  },
  '&:hover > div, & .active': {
    width: '3px',
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: theme.palette.primary.main,
  },
})

type Props = {
  onMouseDown: (event: React.MouseEvent) => void
  grab: boolean
  /** Position it against the left edge of the panel it resizes — for a
   *  right-docked column that has no divider slot of its own in the flow */
  inset?: boolean
}

export const PanelHandle: React.FC<Props> = ({ onMouseDown, grab, inset }) => (
  <Box onMouseDown={onMouseDown} sx={[handleSx, inset ? { left: 0, top: 0 } : {}]}>
    <div className={grab ? 'active' : undefined} />
  </Box>
)
