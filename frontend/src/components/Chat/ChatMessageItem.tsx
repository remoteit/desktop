import React from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { fontSizes } from '../../styling'
import { ChatTranscriptMessage } from '../../models/chat'
import { ChatToolCalls } from './ChatToolCalls'
import { scrollbarStyles } from './chatScrollbar'

// Links open in a new tab: a bare anchor is a top-level navigation, which in
// Electron replaces the app window with the external site (will-navigate only
// guards auth.remote.it); target=_blank routes through setWindowOpenHandler →
// shell.openExternal instead
const markdownComponents = {
  a: ({ node, ...props }: any) => <a {...props} target="_blank" rel="noopener noreferrer" />,
}

// Memoized: immer keeps unchanged message refs stable, so during streaming
// only the tail message re-renders instead of re-parsing every message's
// markdown on each delta
export const ChatMessageItem = React.memo<{ message: ChatTranscriptMessage }>(({ message }) => {
  const { t } = useTranslation()
  if (message.role === 'user')
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginY: 1 }}>
        <Box sx={{ bgcolor: 'primaryLighter.main', borderRadius: 2, paddingX: 1.5, paddingY: 0.75, maxWidth: '85%' }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.text}
          </Typography>
        </Box>
      </Box>
    )

  return (
    <Box sx={{ marginY: 1 }}>
      <ChatToolCalls toolCalls={message.toolCalls} />
      {!!message.text && (
        <Box
          sx={[
            theme => ({ '& pre, & table': scrollbarStyles(theme) }),
            {
              bgcolor: 'white.main',
              borderRadius: 2,
              paddingX: 1.5,
              paddingY: 1,
              fontSize: fontSizes.base,
              lineHeight: 1.5,
              wordBreak: 'break-word',
              '& p': { marginY: 0.75 },
              '& ul, & ol': { paddingLeft: 3, marginY: 0.5 },
              '& li': { marginY: 0.25 },
              '& h1, & h2, & h3, & h4': { fontSize: 15, marginTop: 1.5, marginBottom: 0.5 },
              '& a': { color: 'primary.main' },
              '& code': {
                fontFamily: "'Roboto Mono', monospace",
                fontSize: fontSizes.sm,
                bgcolor: 'grayLighter.main',
                borderRadius: 1,
                paddingX: 0.5,
                paddingY: 0.25,
              },
              '& pre': {
                overflowX: 'auto',
                bgcolor: 'grayLighter.main',
                borderRadius: 2,
                padding: 1.5,
                '& code': { padding: 0, bgcolor: 'transparent' },
              },
              '& table': {
                display: 'block',
                overflowX: 'auto',
                borderCollapse: 'collapse',
                fontSize: fontSizes.sm,
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
            },
          ]}
        >
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.text}
          </Markdown>
        </Box>
      )}
      {message.interrupted && (
        <Typography variant="caption" color="warning.main">
          {t('chat.interrupted', 'Interrupted')}
        </Typography>
      )}
    </Box>
  )
})

ChatMessageItem.displayName = 'ChatMessageItem'
