import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { store, Dispatch } from '../../store'
import { IconButton } from '../../buttons/IconButton'
import { ChatBody } from './ChatBody'
import { initChatPopoutWindow, popIn, ChatHandoff } from '../../services/chatPopout'

const currentHandoff = (): ChatHandoff => {
  const c = store.getState().chat
  return { messages: c.messages, conversationId: c.conversationId, orgId: c.orgId }
}

/* Full-page chat for the popped-out window (?chatPopout boot flag). The
   window chrome provides close; pop-in wiring lands with the protocol. */
export const ChatWindow: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    document.title = 'remote.it chat'
    dispatch.chat.resetTransient()
    dispatch.chat.syncOrg()
    dispatch.chat.checkHealth()
    initChatPopoutWindow({
      adopt: payload => dispatch.chat.adoptTranscript(payload),
      getHandoff: currentHandoff,
      onSignout: () => window.close(),
    })
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'column',
        height: '100%',
        width: '100%',
        bgcolor: 'white.main',
        paddingBottom: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', paddingX: 2, paddingY: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, padding: 0, margin: 0, minHeight: 0 }}>
          New Chat
        </Typography>
        <IconButton icon="plus" title="New Chat" onClick={() => dispatch.chat.clearConversation()} />
        <IconButton
          icon="down-left-and-up-right-to-center"
          title="Pop back in"
          onClick={async () => {
            await dispatch.chat.stop()
            popIn(currentHandoff())
          }}
        />
      </Box>
      <ChatBody />
    </Box>
  )
}
