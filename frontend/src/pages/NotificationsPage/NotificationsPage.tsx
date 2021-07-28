import React, { useState } from 'react'

import { Container } from '../../components/Container'
import { Typography } from '@material-ui/core'
import { Title } from '../../components/Title'
import { NotificationMode } from './NotificationsMode'

export const NotificationsPage: React.FC = () => {

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Notifications</Title>
        </Typography>
      }
    >

      <Typography variant="subtitle1">Delivery Method</Typography>
      <NotificationMode />
    </Container>
  )
}
