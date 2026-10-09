import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Dialog, Grow } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Dispatch, State } from '../store'
import { selectLatestAnnouncement, selectPresentableAnnouncement } from '../selectors/announcements'
import { AnnouncementCard } from './AnnouncementCard'
import { spacing } from '../styling'

export const AnnouncementDialog: React.FC = () => {
  const [presentedId, setPresentedId] = useState<string>()
  const [activeId, setActiveId] = useState<string>()
  const [activeTest, setActiveTest] = useState(false)
  const [open, setOpen] = useState(false)
  const [lastPresentationTest, setLastPresentationTest] = useState<number>()
  const presentable = useSelector((state: State) => selectPresentableAnnouncement(state))
  const latestAnnouncement = useSelector((state: State) => selectLatestAnnouncement(state))
  const presentationTest = useSelector((state: State) => state.ui.announcementPresentationTest)
  const fetched = useSelector((state: State) => state.ui.announcementsFetched)
  const activeAnnouncement = useSelector((state: State) => state.announcements.all.find(a => a.id === activeId))
  const { announcements } = useDispatch<Dispatch>()

  useEffect(() => {
    if (!presentationTest || presentationTest === lastPresentationTest || !latestAnnouncement) return

    setActiveId(latestAnnouncement.id)
    setActiveTest(true)
    setOpen(true)
    setLastPresentationTest(presentationTest)
  }, [lastPresentationTest, latestAnnouncement?.id, presentationTest])

  useEffect(() => {
    // Until this session's fetch lands, the persisted list can be another account's on this browser.
    // Marking read can fail, which would reopen the same notice as soon as it closes.
    if (!fetched || !presentable || presentable.id === presentedId || activeId) return

    setActiveId(presentable.id)
    setActiveTest(false)
    setOpen(true)
    setPresentedId(presentable.id)
  }, [activeId, fetched, presentable?.id, presentedId])

  const handleClose = useCallback(() => {
    if (!activeAnnouncement) return

    setOpen(false)
    if (activeTest) return

    announcements.read(activeAnnouncement.id).catch(error => console.warn('Failed to mark announcement read', error))
  }, [activeAnnouncement, activeTest, announcements])

  // Clear the active announcement only after the exit transition finishes, so the card stays
  // mounted and animates out instead of disappearing instantly.
  const handleExited = useCallback(() => {
    setActiveId(undefined)
    setActiveTest(false)
  }, [])

  if (!activeAnnouncement) return null

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Grow}
      TransitionProps={{ onExited: handleExited }}
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
