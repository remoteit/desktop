import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Menu, MenuItem, ListItemText, ListSubheader, Typography, IconButton as MuiIconButton } from '@mui/material'
import { Dispatch, State } from '../../store'
import { IconButton } from '../../buttons/IconButton'
import { Icon } from '../Icon'
import { fontSizes, spacing } from '../../styling'
import { GuideBubble } from '../GuideBubble'
import { isChatPopout } from '../../services/chatPopout'
import { CHAT_GUIDE_DATE } from '../../constants'

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
  const { t } = useTranslation()
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: 45, maxHeight: 45, paddingX: 2.5, marginTop: 1.5 }}>
      {leading}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', marginLeft: 0.25 }}>
        {/* Step 3. The wrapper sx keeps the shrink chain intact — without minWidth: 0 the
            inserted div would refuse to shrink and the name would stop truncating. */}
        <GuideBubble
          guide="chatHistory"
          added={CHAT_GUIDE_DATE}
          placement="bottom"
          queueAfter="chatCompose"
          hide={isChatPopout}
          sx={{ minWidth: 0, display: 'flex' }}
          instructions={
            <>
              <Typography variant="h3" gutterBottom>
                <b>{t('chat.guideHistoryTitle', 'Your conversations')}</b>
              </Typography>
              <Typography variant="body2" gutterBottom>
                {t('chat.guideHistoryBody', 'Chats are saved. Switch between them, or start a new one, from here.')}
              </Typography>
            </>
          }
        >
          <HistoryButton />
        </GuideBubble>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{children}</Box>
    </Box>
  )
}

export const NewChatButton: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  return (
    <IconButton icon="plus" title={t('chat.newChat', 'New Chat')} onClick={() => dispatch.chat.clearConversation()} />
  )
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
      <MuiIconButton
        onClick={open}
        title={t('chat.history', 'History')}
        sx={{
          minWidth: 0,
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'grayDarker.main',
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
        <Box
          sx={{
            display: 'flex',
            transition: 'transform 150ms',
            transform: anchorEl ? 'rotate(180deg)' : 'none',
          }}
        >
          <Icon name="chevron-down" size="sm" />
        </Box>
      </MuiIconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        /* Match the avatar menu: elevation 2 keeps the edge crisp — MUI's default 8
           is a wide diffuse blur that reads as soft. The list is transparent so the
           paper's white shows through, instead of the theme's grayLightest sitting
           as a second surface inside it. */
        elevation={2}
        sx={{ '& .MuiList-root': { backgroundColor: 'transparent' } }}
        slotProps={{
          paper: {
            sx: {
              maxHeight: 360,
              minWidth: 240,
              // Line the rows up with the subheader: the theme indents dense items
              // by margin 6 + padding 6 = 12, while ListSubheader sits at 18.
              // Two classes, to outrank the theme's own `.MuiMenu-list .MuiMenuItem-dense`
              '& .MuiMenuItem-root.MuiMenuItem-dense': { paddingLeft: `${spacing.sm}px` },
            },
          },
        }}
      >
        <ListSubheader disableGutters disableSticky>
          {t('chat.history', 'History')}
        </ListSubheader>
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
            sx={{
              '& .remove': { opacity: 0, transition: 'opacity 100ms' },
              // Hover, or the button's own KEYBOARD focus. Not :focus-within — MUI
              // focuses the selected item when the menu opens, which would pin the X
              // on the active row. :focus-visible keeps it reachable by tab without
              // matching that programmatic focus.
              '&:hover .remove, & .remove:focus-visible': { opacity: 1 },
            }}
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
              className="remove"
              sx={{ marginLeft: 1 }}
              title={t('chat.deleteConversation', 'Delete')}
              onClick={e => {
                e.stopPropagation()
                dispatch.chat.removeConversation(c.id)
              }}
            >
              <Icon name="times" size="sm" />
            </MuiIconButton>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
