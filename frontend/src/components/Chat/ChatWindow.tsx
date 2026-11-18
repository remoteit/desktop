import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { Dispatch } from '../../store'
import { IconButton } from '../../buttons/IconButton'
import { useChatPopoutSync } from '../../hooks/useChatSync'
import { ChatHeader, NewChatButton } from './ChatHeader'
import { ChatBody } from './ChatBody'
import { selectTurnActive } from '../../models/chat'

/* Full-page chat for the popped-out window (?chatPopout boot flag). Display
   only: the handoff protocol lives in useChatPopoutSync, user actions in the
   chat model. The window chrome provides close. */
export const ChatWindow: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  // The mirror of ChatPanel's Pop out gate. popIn() stop()s this window before handing back, and
  // the handoff carries neither turnId nor the pending approval — so mid-turn it would abort the
  // stream and strand a confirmation_required turn on the server with no window left able to
  // answer it. Block it until the turn is idle, exactly as the dock blocks Pop out.
  const turnActive = useSelector(selectTurnActive)

  useChatPopoutSync()

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'column',
        height: '100%',
        width: '100%',
        bgcolor: 'grayLightest.main',
        paddingBottom: 1,
      }}
    >
      <ChatHeader>
        <NewChatButton />
        <IconButton
          icon="arrow-up-right-from-square"
          flip="both"
          title={t('chat.popIn', 'Pop back in')}
          disabled={turnActive}
          onClick={() => dispatch.chat.popIn()}
        />
      </ChatHeader>
      <ChatBody />
    </Box>
  )
}
