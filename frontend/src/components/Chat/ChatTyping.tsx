import React from 'react'
import { Box } from '@mui/material'
import { radius } from '../../styling'

/* "The agent is working" — three pulsing dots in an assistant-aligned bubble, shown while a
   turn is in flight but nothing else is visibly moving (before the first token, and between
   a tool finishing and the next output). Running tool calls show their own spinner, and
   streaming text is its own motion, so this never doubles up with either. */
export const ChatTyping: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginY: 1 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        bgcolor: 'grayLightest.main',
        borderRadius: `${radius.lg}px`,
        paddingX: 1.5,
        paddingY: 1,
        '@keyframes chatTypingPulse': {
          '0%, 80%, 100%': { opacity: 0.25, transform: 'translateY(0)' },
          '40%': { opacity: 1, transform: 'translateY(-2px)' },
        },
      }}
    >
      {[0, 1, 2].map(i => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'grayDark.main',
            animation: 'chatTypingPulse 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </Box>
  </Box>
)
