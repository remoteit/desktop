import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography, Menu, MenuItem, ListItemText, IconButton as MuiIconButton } from '@mui/material'
import { Dispatch, State } from '../../store'
import { IconButton } from '../../buttons/IconButton'
import { Icon } from '../Icon'

/* Title row shared by the docked panel and the popout window — the
   window-specific buttons render as children in each caller's order */
export const ChatHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const sessionName = useSelector((state: State) => state.chat.title)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', paddingX: 2, paddingY: 1 }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ padding: 0, margin: 0, minHeight: 0, lineHeight: 1.2 }}>
          {t('chat.title', 'Remote.It AI')}
        </Typography>
        <Typography variant="caption" color="grayDark.main" noWrap sx={{ display: 'block', maxWidth: '100%' }}>
          {sessionName || t('chat.newSession', 'New chat')}
        </Typography>
      </Box>
      {children}
    </Box>
  )
}

export const NewChatButton: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  return <IconButton icon="plus" title={t('chat.newChat', 'New Chat')} onClick={() => dispatch.chat.clearConversation()} />
}

/* History picker: the server-side conversation list (D11), newest first. Selecting one
   loads its transcript; the trash affordance deletes it for real. */
export const HistoryButton: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const conversations = useSelector((state: State) => state.chat.conversations)
  const currentId = useSelector((state: State) => state.chat.conversationId)
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null)

  const open = (e: React.MouseEvent) => {
    dispatch.chat.loadConversations() // freshen on open
    setAnchorEl(e.currentTarget)
  }
  const close = () => setAnchorEl(null)

  return (
    <>
      <IconButton icon="clock-rotate-left" title={t('chat.history', 'History')} onClick={open} />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close} slotProps={{ paper: { sx: { maxHeight: 360, minWidth: 240 } } }}>
        {conversations.length === 0 && (
          <MenuItem disabled dense>
            <ListItemText primary={t('chat.historyEmpty', 'No past conversations')} />
          </MenuItem>
        )}
        {conversations.map(c => (
          <MenuItem
            key={c.id}
            dense
            selected={c.id === currentId}
            onClick={() => {
              dispatch.chat.openConversation(c.id)
              close()
            }}
          >
            <ListItemText
              primary={c.title || t('chat.untitled', 'New conversation')}
              primaryTypographyProps={{ noWrap: true, sx: { maxWidth: 240 } }}
            />
            <MuiIconButton
              edge="end"
              size="small"
              sx={{ marginLeft: 1 }}
              title={t('chat.deleteConversation', 'Delete')}
              onClick={e => {
                e.stopPropagation()
                dispatch.chat.removeConversation(c.id)
              }}
            >
              <Icon name="trash" size="xs" />
            </MuiIconButton>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
