import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Button, Typography } from '@mui/material'
import { State, Dispatch } from '../../store'
import { ChatMessages } from './ChatMessages'
import { ChatApproval } from './ChatApproval'
import { ChatInput } from './ChatInput'
import { ChatIntro } from './ChatIntro'
import { ChatOrgLabel } from './ChatOrgLabel'
import { Notice } from '../Notice'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { isChatPopout } from '../../services/chatPopout'

/* Everything below the chat header — shared by the docked panel and the
   popout window */
export const ChatBody: React.FC = () => {
  const { t } = useTranslation()
  const messages = useSelector((state: State) => state.chat.messages)
  const streaming = useSelector((state: State) => state.chat.streaming)
  const health = useSelector((state: State) => state.chat.health)
  const pendingConfirmation = useSelector((state: State) => state.chat.pendingConfirmation)
  const error = useSelector((state: State) => state.chat.error)
  const dispatch = useDispatch<Dispatch>()
  const signedOut = health === 'unauthorized'
  const unreachable = health === 'unreachable'
  // Literal default: the i18next parser can't extract a value passed as a variable
  const unavailableMessage = t(
    'chat.unavailable',
    'Remote.It AI is temporarily unavailable. Check your internet connection or try again in a few minutes.'
  )

  // "Working" indicator: a turn is in flight but nothing else is moving — before the first
  // token, and between a tool finishing and the next output. A running tool shows its own
  // spinner and streaming text is its own motion, so suppress the dots while either is live.
  const tail = messages[messages.length - 1]
  const tailIsStreamingText = tail?.role === 'assistant' && tail.text.length > 0
  const toolRunning = tail?.role === 'assistant' && tail.toolCalls.some(c => c.status === 'running')
  const typing = streaming && !tailIsStreamingText && !toolRunning

  return (
    <>
      <ChatOrgLabel />
      {unreachable && !!messages.length && (
        <Notice severity="warning" gutterTop>
          {unavailableMessage}
        </Notice>
      )}
      {signedOut ? (
        <Body center>
          <Icon name="remote-ai" size="xxxl" color="grayDark" />
          <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 320, padding: 3 }}>
            {t('chat.signInNeeded', 'The AI agent needs permissions your session doesn\u2019t carry yet.')}
            {isChatPopout && ` ${t('chat.signInFromMain', 'Refresh permissions from the main app window.')}`}
          </Typography>
          {!isChatPopout && (
            <Button variant="contained" size="medium" onClick={() => dispatch.chat.signIn()}>
              {t('chat.signIn', 'Refresh permissions')}
            </Button>
          )}
        </Body>
      ) : unreachable && !messages.length ? (
        <Body center>
          <Icon name="remote-ai" size="xxxl" color="grayDark" />
          <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 320, padding: 3 }}>
            {unavailableMessage}
          </Typography>
        </Body>
      ) : !messages.length && !pendingConfirmation && !error ? (
        <ChatIntro />
      ) : (
        <ChatMessages messages={messages} streaming={streaming} typing={typing}>
          {pendingConfirmation && (
            <ChatApproval
              toolName={pendingConfirmation.toolName}
              input={pendingConfirmation.input}
              onRespond={approved => dispatch.chat.confirm(approved)}
            />
          )}
          {error && (
            <Notice severity="error" onClose={() => dispatch.chat.set({ error: null })}>
              {error}
            </Notice>
          )}
        </ChatMessages>
      )}
      <ChatInput
        disabled={!!pendingConfirmation || signedOut || unreachable}
        placeholder={
          pendingConfirmation
            ? t('chat.waitingApproval', 'Waiting for approval…')
            : t('chat.inputPlaceholder', 'Message Remote.It AI…')
        }
        streaming={streaming}
        onSend={text => dispatch.chat.send(text)}
        onStop={() => dispatch.chat.stop()}
      />
    </>
  )
}
