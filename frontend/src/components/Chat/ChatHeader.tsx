import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Box, ButtonBase, Menu, MenuItem, ListItemText, IconButton as MuiIconButton } from '@mui/material'
import { Dispatch, State } from '../../store'
import { IconButton } from '../../buttons/IconButton'
import { Icon } from '../Icon'
import { fontSizes, radius } from '../../styling'

/* Control row shared by the docked panel and the popout window — `leading` takes the
   panel-chrome control (expand/collapse) at the far left, then the conversation's name,
   which doubles as the history picker; window-specific actions render as children on the
   right in each caller's order. The row mirrors the app Header's box exactly — same
   height, same top margin, centered — so the two icon rows share a baseline across the
   divider. The name is the only thing allowed to shrink: it takes the slack and yields
   it back, so the action icons never compress. */
export const ChatHeader: React.FC<{ leading?: React.ReactNode; children?: React.ReactNode }> = ({
  leading,
  children,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: 45, maxHeight: 45, paddingX: 2.5, marginTop: 1.5 }}>
      {leading}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', marginLeft: 0.25 }}>
        <HistoryButton />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{children}</Box>
    </Box>
  )
}

export const NewChatButton: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  return <IconButton icon="plus" title={t('chat.newChat', 'New Chat')} onClick={() => dispatch.chat.clearConversation()} />
}

/* History picker: the conversation's NAME is the control — the header carries no
   separate title, so the thing you read is the thing you click. Opens the server-side
   list (D11), newest first; selecting one loads its transcript and the trash affordance
   deletes it for real. */
export const HistoryButton: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const labelRef = React.useRef<HTMLSpanElement>(null)
  const [cropped, setCropped] = React.useState(false)
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

  const label = currentTitle || t('chat.newSession', 'New chat')

  /* Fade the trailing edge only while the name is ACTUALLY cut off — an unconditional
     mask would dissolve the last characters of a name that fits. Observed rather than
     measured once, so dragging the panel narrower re-evaluates it. */
  React.useEffect(() => {
    const element = labelRef.current
    if (!element) return
    const measure = () => setCropped(element.scrollWidth > element.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [label])

  const fade = 'linear-gradient(90deg, #000 calc(100% - 20px), transparent)'

  return (
    <>
      <ButtonBase
        onClick={open}
        title={t('chat.history', 'History')}
        sx={{
          minWidth: 0,
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          paddingX: 0.75,
          paddingY: 0.25,
          borderRadius: `${radius.sm}px`,
          color: 'grayDarker.main',
          '&:hover': { bgcolor: 'primaryLighter.main' },
        }}
      >
        <Box
          ref={labelRef}
          component="span"
          sx={{
            minWidth: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontSize: fontSizes.base,
            ...(cropped ? { maskImage: fade, WebkitMaskImage: fade } : {}),
          }}
        >
          {label}
        </Box>
        <Icon name="caret-down" size="xxs" />
      </ButtonBase>
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
