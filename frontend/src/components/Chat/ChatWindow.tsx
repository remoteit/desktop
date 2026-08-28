import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Box } from '@mui/material'
import { Dispatch } from '../../store'
import { IconButton } from '../../buttons/IconButton'
import { useChatPopoutSync } from '../../hooks/useChatSync'
import { ChatHeader, NewChatButton } from './ChatHeader'
import { ChatBody } from './ChatBody'

/* Full-page chat for the popped-out window (?chatPopout boot flag). Display
   only: the handoff protocol lives in useChatPopoutSync, user actions in the
   chat model. The window chrome provides close. */
export const ChatWindow: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()

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
          onClick={() => dispatch.chat.popIn()}
        />
      </ChatHeader>
      <ChatBody />
    </Box>
  )
}
