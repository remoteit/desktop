import React from 'react'
import { Container } from '../../components/Container'
import { Typography } from '@mui/material'
import { Title } from '../../components/Title'
import { NotificationMode } from './NotificationsMode'

export const NotificationsPage: React.FC = () => {
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" gutterBottom>
          <Title>Notifications</Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">Method</Typography>
      <NotificationMode />
    </Container>
  )
}
