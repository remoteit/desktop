import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Box, TextField, Typography } from '@mui/material'
import { State, Dispatch } from '../../store'
import { CHAT_PANEL_WIDTH, CHAT_PANEL_WIDTH_EXPANDED } from '../../constants'
import { IconButton } from '../../buttons/IconButton'
import { ChatMessages } from './ChatMessages'
import { ChatApproval } from './ChatApproval'
import { ChatInput } from './ChatInput'
import { Notice } from '../Notice'

export const ChatPanel: React.FC = () => {
  const chat = useSelector((state: State) => state.chat)
  const singlePanel = useSelector((state: State) => state.ui.layout.singlePanel)
  const dispatch = useDispatch<Dispatch>()
  const [tokenDraft, setTokenDraft] = useState('')

  useEffect(() => {
    if (chat.open) {
      dispatch.chat.resetTransient()
      dispatch.chat.checkHealth()
    }
  }, [chat.open])

  if (!chat.open) return null

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'column',
        flexShrink: 0,
        // Docked column beside the panels; full-screen overlay below the
        // single-panel breakpoint, matching how pages collapse
        ...(singlePanel
          ? { position: 'absolute', inset: 0, width: '100%', zIndex: 15 }
          : {
              position: 'relative',
              height: '100%',
              width: chat.expanded ? CHAT_PANEL_WIDTH_EXPANDED : CHAT_PANEL_WIDTH,
            }),
        bgcolor: 'white.main',
        borderLeft: singlePanel ? 0 : 1,
        borderColor: 'grayLighter.main',
        paddingBottom: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', paddingX: 2, paddingY: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, padding: 0, margin: 0, minHeight: 0 }}>
          New Chat
        </Typography>
        {!singlePanel && (
          <IconButton
            icon="arrows-left-right"
            title={chat.expanded ? 'Collapse' : 'Expand'}
            onClick={() => dispatch.chat.set({ expanded: !chat.expanded })}
          />
        )}
        <IconButton icon="plus" title="New Chat" onClick={() => dispatch.chat.clearConversation()} />
        <IconButton icon="times" title="Close" onClick={() => dispatch.chat.set({ open: false })} />
      </Box>
      {chat.health === 'unreachable' && (
        <Notice severity="warning" gutterTop>
          Agent unreachable — is the dev service running on :3001?
        </Notice>
      )}
      {chat.health === 'unauthorized' && (
        <Notice severity="warning" gutterTop>
          {/* Stage A: paste a token from the ai-agent dev harness
              (`node scripts/hydra-login.mjs token`). Replaced by the in-app
              sign-in flow in a later stage. */}
          <>
            Agent sign-in required.
            <TextField
              fullWidth
              size="small"
              type="password"
              variant="filled"
              label="Paste an agent access token"
              value={tokenDraft}
              onChange={event => setTokenDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && tokenDraft.trim()) {
                  dispatch.chat.setToken(tokenDraft)
                  setTokenDraft('')
                }
              }}
              sx={{ marginTop: 1 }}
            />
          </>
        </Notice>
      )}
      <ChatMessages messages={chat.messages} streaming={chat.streaming}>
        {chat.pendingConfirmation && (
          <ChatApproval
            toolName={chat.pendingConfirmation.toolName}
            input={chat.pendingConfirmation.input}
            onRespond={approved => dispatch.chat.confirm(approved)}
          />
        )}
        {chat.error && (
          <Notice severity="error" onClose={() => dispatch.chat.set({ error: null })}>
            {chat.error}
          </Notice>
        )}
      </ChatMessages>
      <ChatInput
        disabled={!!chat.pendingConfirmation}
        streaming={chat.streaming}
        onSend={text => dispatch.chat.send(text)}
        onStop={() => dispatch.chat.stop()}
      />
    </Box>
  )
}
