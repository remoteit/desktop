import React from 'react'
import { Box } from '@mui/material'
import { Icon } from '../Icon'

/* "The agent is working" — the same mark that signs a finished answer, with its signal
   arcs broadcasting. Shown while a turn is in flight but nothing else is visibly moving
   (before the first token, and between a tool finishing and the next output). Running
   tool calls show their own spinner, and streaming text is its own motion, so this never
   doubles up with either.

   It sits at the sign-off's exact offset, so across a turn the mark reads as one object:
   it pulses here, the answer streams in above it, and it settles at the end of the card
   (see ChatMessageItem's `signed`). The arcs light outward — inner, then outer — which is
   why the delays differ rather than the durations. */
export const ChatTyping: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      marginY: 1,
      marginLeft: 2,
      color: 'primary.main',
      '@keyframes chatSignalPulse': {
        '0%, 70%, 100%': { opacity: 0.15 },
        '35%': { opacity: 1 },
      },
      '& .signal-inner, & .signal-outer': {
        animation: 'chatSignalPulse 1.6s infinite ease-in-out',
      },
      '& .signal-outer': { animationDelay: '0.25s' },
      // Motion is decorative here — the mark's presence already says "working"
      '@media (prefers-reduced-motion: reduce)': {
        '& .signal-inner, & .signal-outer': { animation: 'none' },
      },
    }}
  >
    <Icon name="remote-ai" size="lg" />
  </Box>
)
