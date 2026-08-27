import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Menu, MenuItem, ListItemText, IconButton as MuiIconButton } from '@mui/material'
import { Dispatch, State } from '../../store'
import { IconButton } from '../../buttons/IconButton'
import { Icon } from '../Icon'

/* Control row shared by the docked panel and the popout window — `leading` takes the
   panel-chrome control (expand/collapse) at the far left, the window-specific actions
   render as children on the right in each caller's order. Carries no title: the
   conversation names itself in the history menu, where picking one is the point.
   The row mirrors the app Header's box exactly — same height, same top margin, centered
   — so the two icon rows share a baseline across the divider. */
export const ChatHeader: React.FC<{ leading?: React.ReactNode; children?: React.ReactNode }> = ({
  leading,
  children,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: 45, maxHeight: 45, paddingX: 2.25, marginTop: 1.5 }}>
      {leading}
      <Box sx={{ flexGrow: 1, minWidth: 0 }} />
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
  const currentTitle = useSelector((state: State) => state.chat.title)

  /* The open conversation is the panel's only name now that the header carries none,
     so it must appear here even before the server list catches up with it — a turn
     just started, or the title was set moments ago. Prepend it when missing. */
  const listed = conversations.some(c => c.id === currentId)
  const items =
    currentId && !listed
      ? [{ id: currentId, title: currentTitle, createdAt: '', updatedAt: '' }, ...conversations]
      : conversations
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
        {items.length === 0 && (
          <MenuItem disabled dense>
            <ListItemText primary={t('chat.historyEmpty', 'No past conversations')} />
          </MenuItem>
        )}
        {items.map(c => (
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
