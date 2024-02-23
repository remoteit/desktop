import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Typography } from '@mui/material'
import { selectAnnouncements } from '../selectors/announcements'
import { AnnouncementCardTest } from '../components/AnnouncementCardTest'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

export const AnnouncementsPage = () => {
  const announcements = useSelector((state: State) => selectAnnouncements(state))
  const [scrollPosition, setScrollPosition] = useState<number>(0)
  const bodyRef = useRef<HTMLDivElement>(null)

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
          <Title>Notifications</Title>
        </Typography>
      }
    >
      <AnnouncementCardTest hide />
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
