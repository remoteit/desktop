import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Button, Typography } from '@mui/material'
import { State, Dispatch } from '../../store'
import { ChatMessages } from './ChatMessages'
import { ChatApproval } from './ChatApproval'
import { ChatInput } from './ChatInput'
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
    'Mycal is temporarily unavailable. Check your internet connection or try again in a few minutes.'
  )

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
          <Icon name="robot" size="xxxl" color="grayDark" />
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
          <Icon name="robot" size="xxxl" color="grayDark" />
          <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 320, padding: 3 }}>
            {unavailableMessage}
          </Typography>
        </Body>
      ) : (
        <ChatMessages messages={messages} streaming={streaming}>
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
        placeholder={pendingConfirmation ? t('chat.waitingApproval', 'Waiting for approval…') : ''}
        streaming={streaming}
        onSend={text => dispatch.chat.send(text)}
        onStop={() => dispatch.chat.stop()}
      />
    </>
  )
}
