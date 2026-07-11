import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Dialog } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Dispatch, State } from '../store'
import { selectLatestAnnouncement, selectLatestUnreadAnnouncement } from '../selectors/announcements'
import { AnnouncementCard } from './AnnouncementCard'
import { spacing } from '../styling'

export const AnnouncementDialog: React.FC = () => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string>()
  const [activeTest, setActiveTest] = useState(false)
  const [lastPresentationTest, setLastPresentationTest] = useState<number>()
  const latestUnread = useSelector((state: State) => selectLatestUnreadAnnouncement(state))
  const latestAnnouncement = useSelector((state: State) => selectLatestAnnouncement(state))
  const presentationTest = useSelector((state: State) => state.ui.announcementPresentationTest)
  const activeAnnouncement = useSelector((state: State) => state.announcements.all.find(a => a.id === activeId))
  const { announcements } = useDispatch<Dispatch>()
  const open = !!activeAnnouncement && (activeTest || !dismissedIds.includes(activeAnnouncement.id))

  useEffect(() => {
    if (!presentationTest || presentationTest === lastPresentationTest || !latestAnnouncement) return

    setActiveId(latestAnnouncement.id)
    setActiveTest(true)
    setLastPresentationTest(presentationTest)
  }, [lastPresentationTest, latestAnnouncement?.id, presentationTest])

  useEffect(() => {
    if (!latestUnread || activeId || dismissedIds.includes(latestUnread.id)) return

    setActiveId(latestUnread.id)
    setActiveTest(false)
  }, [activeId, dismissedIds, latestUnread?.id])

  const handleClose = useCallback(() => {
    if (!activeAnnouncement) return

    setDismissedIds(ids => (ids.includes(activeAnnouncement.id) ? ids : [...ids, activeAnnouncement.id]))
    setActiveId(undefined)
    if (activeTest) return

    announcements.setPresentedThrough(activeAnnouncement.modified?.getTime() || 0)
    announcements.read(activeAnnouncement.id).catch(error => console.warn('Failed to mark announcement read', error))
  }, [activeAnnouncement, activeTest, announcements])

  if (!activeAnnouncement) return null

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDialog-paper': { backgroundColor: 'transparent', boxShadow: 'none' },
        '& .MuiBackdrop-root': {
          backgroundColor: theme => alpha(theme.palette.darken.main, 0.2),
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <Box
        onClick={handleClose}
        sx={{
          minHeight: '100%',
          overflowY: 'auto',
          position: 'relative',
          backgroundColor: 'transparent',
          color: 'grayDarkest.main',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: { xs: `${spacing.max}px 0 0`, sm: `${spacing.max}px ${spacing.xxl}px ${spacing.xxl}px` },
        }}
      >
        <Box sx={{ minHeight: '100%', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box onClick={event => event.stopPropagation()}>
            <AnnouncementCard data={activeAnnouncement} hideMarkReadAction />
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}
