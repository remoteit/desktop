import React from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Box, Typography } from '@mui/material'
import { ChatTranscriptMessage } from '../../models/chat'
import { ChatToolCalls } from './ChatToolCalls'

export const ChatMessageItem: React.FC<{ message: ChatTranscriptMessage }> = ({ message }) => {
  if (message.role === 'user')
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginY: 1 }}>
        <Box
          sx={{ bgcolor: 'primaryHighlight.main', borderRadius: 2, paddingX: 1.5, paddingY: 0.75, maxWidth: '85%' }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.text}
          </Typography>
        </Box>
      </Box>
    )

  return (
    <Box sx={{ marginY: 1 }}>
      <ChatToolCalls toolCalls={message.toolCalls} />
      <Box
        sx={{
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          '& p': { marginY: 0.75 },
          '& ul, & ol': { paddingLeft: 3, marginY: 0.5 },
          '& li': { marginY: 0.25 },
          '& h1, & h2, & h3, & h4': { fontSize: 15, marginTop: 1.5, marginBottom: 0.5 },
          '& a': { color: 'primary.main' },
          '& code': {
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 12,
            bgcolor: 'grayLightest.main',
            borderRadius: 1,
            paddingX: 0.5,
            paddingY: 0.25,
          },
          '& pre': {
            overflowX: 'auto',
            bgcolor: 'grayLightest.main',
            borderRadius: 2,
            padding: 1.5,
            '& code': { padding: 0, bgcolor: 'transparent' },
          },
          '& table': {
            display: 'block',
            overflowX: 'auto',
            borderCollapse: 'collapse',
            fontSize: 12,
            marginY: 1,
          },
          '& th, & td': {
            border: '1px solid',
            borderColor: 'grayLighter.main',
            paddingX: 1,
            paddingY: 0.5,
            textAlign: 'left',
            whiteSpace: 'nowrap',
          },
          '& blockquote': {
            borderLeft: '3px solid',
            borderColor: 'grayLighter.main',
            marginX: 0,
            paddingLeft: 1.5,
            color: 'grayDark.main',
          },
        }}
      >
        <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
      </Box>
      {message.interrupted && (
        <Typography variant="caption" color="warning.main">
          Interrupted
        </Typography>
      )}
    </Box>
  )
}
