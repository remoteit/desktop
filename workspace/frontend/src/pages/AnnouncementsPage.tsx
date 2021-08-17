import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Typography } from '@material-ui/core'
import { selectAnnouncements } from '../models/announcements'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const AnnouncementsPage = () => {
  const announcements = useSelector((state: ApplicationState) => selectAnnouncements(state))
  const [scrollPosition, setScrollPosition] = useState<number>(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = e => {
      const top = bodyRef.current?.scrollTop || 0
      const height = bodyRef.current?.offsetHeight || 0
      setScrollPosition(top + height)
    }
    bodyRef.current?.addEventListener('scroll', onScroll)
    return () => bodyRef.current?.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Container
      bodyRef={bodyRef}
      bodyProps={{ inset: true, flex: true }}
      header={
        <Typography variant="h1">
          <Title>Announcements</Title>
        </Typography>
      }
    >
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
