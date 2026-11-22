import React from 'react'
import { EventList } from '../components/EventList'
import { EventHeader } from '../components/EventList/EventHeader'
import { Container } from '../components/Container'

export const LogsPage: React.FC = () => {
  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <EventHeader />
      }
    >
      <EventList />
    </Container>
  )
}
