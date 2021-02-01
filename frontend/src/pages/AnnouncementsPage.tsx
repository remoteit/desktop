import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Typography } from '@material-ui/core'
import { selectAnnouncements } from '../models/announcements'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const AnnouncementsPage = () => {
  const enabled = useSelector((state: ApplicationState) => selectAnnouncements(state))

  return (
    <Container
      bodyProps={{ inset: true, flex: true }}
      header={
        <Typography variant="h1">
          <Icon name="megaphone" size="lg" />
          <Title inline>Announcements</Title>
        </Typography>
      }
    >
      {enabled.map((announcement, index) => (
        <AnnouncementCard key={index} data={announcement} />
      ))}
    </Container>
  )
}
