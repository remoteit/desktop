import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography, Button } from '@material-ui/core'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { useHistory } from 'react-router-dom'
import analyticsHelper from '../helpers/analyticsHelper'

export const AnnouncementsPage = () => {
  // const { announcements } = useDispatch<Dispatch>()
  const visible = useSelector((state: ApplicationState) => state.announcements.all.filter(n => n.enabled))
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    // announcements.read(announcement.id)
  }, [])

  return (
    <Container
      inset
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="megaphone" size="lg" />
            <Title inline>Announcements</Title>
          </Typography>
        </>
      }
    >
      {visible.map((announcement, index) => (
        <AnnouncementCard key={index} announcement={announcement} />
      ))}
    </Container>
  )
}
