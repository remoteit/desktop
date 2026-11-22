import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { selectAnnouncements } from '../selectors/announcements'
import { AnnouncementCardTest } from '../components/AnnouncementCardTest'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

export const AnnouncementsPage = () => {
  const announcements = useSelector((state: State) => selectAnnouncements(state))
  const [scrollPosition, setScrollPosition] = useState<number>(0)
  const bodyRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const currentBodyRef = bodyRef.current

    const onScroll = () => {
      const top = bodyRef.current?.scrollTop || 0
      const height = bodyRef.current?.offsetHeight || 0
      setScrollPosition(top + height)
    }
    onScroll()

    currentBodyRef?.addEventListener('scroll', onScroll)
    return () => currentBodyRef?.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Container
      bodyRef={bodyRef}
      bodyProps={{ inset: true, flex: true, verticalOverflow: true }}
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{t('announcementsPage.title', 'Announcements')}</Title>
        </Typography>
      }
    >
      <AnnouncementCardTest hide />
      {!announcements.length && (
        <Typography variant="body2" color="textSecondary" data-announcements-empty>
          {t('announcementsPage.empty', 'No announcements yet.')}
        </Typography>
      )}
      {announcements.map((announcement, index) => (
        <AnnouncementCard
          key={index}
          scrollPosition={!announcement.read ? scrollPosition : undefined}
          data={announcement}
        />
      ))}
    </Container>
  )
}
