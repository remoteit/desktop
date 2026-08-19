import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { Dispatch } from '../../store'
import { IconButton } from '../../buttons/IconButton'

/* Title row shared by the docked panel and the popout window — the
   window-specific buttons render as children in each caller's order */
export const ChatHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', paddingX: 2, paddingY: 1 }}>
    <Typography variant="subtitle1" sx={{ flexGrow: 1, padding: 0, margin: 0, minHeight: 0 }}>
      Mycal
    </Typography>
    {children}
  </Box>
)

export const NewChatButton: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  return <IconButton icon="plus" title={t('chat.newChat', 'New Chat')} onClick={() => dispatch.chat.clearConversation()} />
}
