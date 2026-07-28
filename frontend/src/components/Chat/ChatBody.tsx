import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from '@mui/material'
import { State, Dispatch } from '../../store'
import { ChatMessages } from './ChatMessages'
import { ChatApproval } from './ChatApproval'
import { ChatInput } from './ChatInput'
import { ChatOrgSelect } from './ChatOrgSelect'
import { Notice } from '../Notice'
import { isChatPopout } from '../../services/chatPopout'

/* Everything below the chat header — shared by the docked panel and the
   popout window */
export const ChatBody: React.FC = () => {
  const chat = useSelector((state: State) => state.chat)
  const dispatch = useDispatch<Dispatch>()

  return (
    <>
      <ChatOrgSelect />
      {chat.health === 'unreachable' && (
        <Notice severity="warning" gutterTop>
          Agent unreachable — is the dev service running on :3001?
        </Notice>
      )}
      {chat.health === 'unauthorized' && (
        <Notice severity="warning" gutterTop>
          <>
            The AI agent needs its own sign-in to act on your behalf.
            {isChatPopout ? (
              ' Sign in from the main app window.'
            ) : (
              <Button
                fullWidth
                size="small"
                variant="contained"
                onClick={() => dispatch.chat.signIn()}
                sx={{ marginTop: 1 }}
              >
                Sign in with remote.it
              </Button>
            )}
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
    </>
  )
}
