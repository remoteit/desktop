import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button, Typography } from '@mui/material'
import { State, Dispatch } from '../../store'
import { ChatMessages } from './ChatMessages'
import { ChatApproval } from './ChatApproval'
import { ChatInput } from './ChatInput'
import { ChatOrgSelect } from './ChatOrgSelect'
import { Notice } from '../Notice'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { isChatPopout } from '../../services/chatPopout'

const UNAVAILABLE_MESSAGE = 'Mycal is temporarily unavailable. Check your internet connection or try again in a few minutes.'

/* Everything below the chat header — shared by the docked panel and the
   popout window */
export const ChatBody: React.FC = () => {
  const chat = useSelector((state: State) => state.chat)
  const dispatch = useDispatch<Dispatch>()
  const signedOut = chat.health === 'unauthorized'
  const unreachable = chat.health === 'unreachable'

  return (
    <>
      <ChatOrgSelect />
      {unreachable && !!chat.messages.length && (
        <Notice severity="warning" gutterTop>
          {UNAVAILABLE_MESSAGE}
        </Notice>
      )}
      {signedOut ? (
        <Body center>
          <Icon name="robot" size="xxxl" color="grayDark" />
          <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 320, padding: 3 }}>
            The AI agent needs its own sign-in to act on your behalf.
            {isChatPopout && ' Sign in from the main app window.'}
          </Typography>
          {!isChatPopout && (
            <Button variant="contained" size="medium" onClick={() => dispatch.chat.signIn()}>
              Sign in with remote.it
            </Button>
          )}
        </Body>
      ) : unreachable && !chat.messages.length ? (
        <Body center>
          <Icon name="robot" size="xxxl" color="grayDark" />
          <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 320, padding: 3 }}>
            {UNAVAILABLE_MESSAGE}
          </Typography>
        </Body>
      ) : (
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
      )}
      <ChatInput
        disabled={!!chat.pendingConfirmation || signedOut || unreachable}
        placeholder={chat.pendingConfirmation ? 'Waiting for approval…' : ''}
        streaming={chat.streaming}
        onSend={text => dispatch.chat.send(text)}
        onStop={() => dispatch.chat.stop()}
      />
    </>
  )
}
