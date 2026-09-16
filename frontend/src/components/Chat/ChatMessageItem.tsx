import React from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { fontSizes, radius, scrollbarStyles, SCROLLBAR_WIDTH_NARROW } from '../../styling'
import { ChatTranscriptMessage } from '../../models/chat'
import { ChatToolCalls } from './ChatToolCalls'

// Links open in a new tab: a bare anchor is a top-level navigation, which in
// Electron replaces the app window with the external site (will-navigate only
// guards auth.remote.it); target=_blank routes through setWindowOpenHandler →
// shell.openExternal instead
const markdownComponents = {
  a: ({ node, ...props }: any) => <a {...props} target="_blank" rel="noopener noreferrer" />,
}

type Props = {
  message: ChatTranscriptMessage
}

// Memoized: immer keeps unchanged message refs stable, so during streaming
// only the tail message re-renders instead of re-parsing every message's
// markdown on each delta
export const ChatMessageItem = React.memo<Props>(({ message }) => {
  const { t } = useTranslation()
  if (message.role === 'user')
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginY: 2 }}>
        <Box
          sx={{
            bgcolor: 'primaryLighter.main',
            borderRadius: `${radius.lg}px`,
            marginLeft: 8,
            padding: 2,
            paddingY: 1.25,
          }}
        >
          <Typography variant="body2" color="grayDarker.main" sx={{ whiteSpace: 'pre-wrap' }}>
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
            theme => ({
              // Each surface names the color BEHIND its scrollbar, which is what makes
              // the track invisible until hover: `pre` is a gray block, while a table's
              // strip sits on the card itself. Keep these in step with the `& pre` /
              // `& th, & td` backgrounds below — a stale color shows as a stray bar.
              '& pre': scrollbarStyles(theme, { background: 'grayLighter', width: SCROLLBAR_WIDTH_NARROW }),
              '& table': scrollbarStyles(theme, { background: 'grayLightest', width: SCROLLBAR_WIDTH_NARROW }),
            }),
            {
              // No card: the agent's words sit on the panel itself, flush with the
              // column edge the user bubble hangs from. The user's turns are then the
              // only cards, which is what makes each of them stand out in a long thread.
              paddingY: 0.5,
              fontSize: fontSizes.base,
              lineHeight: 1.7,
              wordBreak: 'break-word',
              // Theme tokens, and the app's own emphasis convention (see theme.ts
              // body1/caption): bold is a COLOR step plus weight 500 — never 700.
              color: 'grayDarker.main',
              '& strong, & b': { fontWeight: 'medium', color: 'grayDarkest.main' },
              '& p': { marginY: 0.75 },
              '& ul, & ol': { paddingLeft: 3, marginY: 0.5 },
              '& li': { marginY: 0.25 },
              '& h1, & h2, & h3, & h4': {
                fontSize: fontSizes.md,
                fontWeight: 'medium',
                color: 'grayDarkest.main',
                marginTop: 1.5,
                marginBottom: 0.5,
              },
              '& a': { color: 'primary.main' },
              '& code': {
                fontFamily: "'Roboto Mono', monospace",
                fontSize: fontSizes.sm,
                bgcolor: 'grayLighter.main',
                borderRadius: `${radius.sm}px`,
                paddingX: 0.5,
                paddingY: 0.25,
              },
              '& pre': {
                overflowX: 'auto',
                bgcolor: 'grayLighter.main',
                // One step of gray against the panel is not enough on its own to read
                // as a block; the hairline does that work without darkening the fill.
                border: '1px solid',
                borderColor: 'grayLight.main',
                borderRadius: `${radius.lg}px`,
                padding: 1.5,
                '& code': { padding: 0, bgcolor: 'transparent' },
              },
              '& table': {
                display: 'block',
                overflowX: 'auto',
                borderCollapse: 'collapse',
                fontSize: fontSizes.sm,
                marginY: 2,
                borderRadius: `${radius.sm}px`,
              },
              // The cells carry the fill and the grid is drawn in the panel's own gray, so
              // the rules read as gaps rather than lines — the same trick as before, with
              // the colors swapped now that the table sits on the panel and not a card.
              '& th, & td': {
                bgcolor: 'white.main',
                border: '1px solid',
                borderColor: 'grayLightest.main',
                paddingX: 1.5,
                paddingY: 0.5,
                textAlign: 'left',
                whiteSpace: 'nowrap',
                '& code': {
                  bgcolor: 'grayLighter.main',
                },
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
