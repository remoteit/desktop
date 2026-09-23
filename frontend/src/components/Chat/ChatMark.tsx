import React from 'react'
import { Box } from '@mui/material'
import { Icon } from '../Icon'

/* The transcript's one and only AI mark. It lives at the bottom of the conversation
   permanently rather than per message: a mark under every answer reads as a repeated
   avatar, and the thing it actually reports — whether the agent is working right now —
   is a property of the conversation, not of any one message.

   Idle it sits grey and still; while a turn is in flight it goes brand blue and the
   signal arcs broadcast outward — inner first, then outer, which is why the delays
   differ rather than the durations. */
export const ChatMark: React.FC<{ active?: boolean }> = ({ active }) => (
  <Box
    sx={{
      display: 'flex',
      marginTop: 3,
      marginBottom: 2,
      marginLeft: 2,
      color: active ? 'primary.main' : 'grayDarker.main',
      transition: 'color 300ms',
      '@keyframes chatSignalPulse': {
        '0%, 70%, 100%': { opacity: 0.15 },
        '35%': { opacity: 1 },
      },
      ...(active && {
        '& .signal-inner, & .signal-outer': { animation: 'chatSignalPulse 1.6s infinite ease-in-out' },
        '& .signal-outer': { animationDelay: '0.25s' },
      }),
      // Motion is decorative — the color change already says "working"
      '@media (prefers-reduced-motion: reduce)': {
        '& .signal-inner, & .signal-outer': { animation: 'none' },
      },
    }}
  >
    <Icon name="remote-ai" size="lg" />
  </Box>
)
