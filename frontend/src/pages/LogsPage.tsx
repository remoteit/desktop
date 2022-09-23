import React from 'react'
import { Typography } from '@mui/material'
import { EventList } from '../components/EventList'
import { EventHeader } from '../components/EventList/EventHeader'
import { Container } from '../components/Container'

export const LogsPage: React.FC = () => (
  <Container
    bodyProps={{ verticalOverflow: true }}
    header={
      <>
        <Typography variant="h1">Logs</Typography>
        <EventHeader />
      </>
    }
  >
    <EventList />
  </Container>
)
