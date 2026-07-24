import React from 'react'
import { Container } from '../../components/Container'
import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Title } from '../../components/Title'
import { NotificationMode } from './NotificationsMode'

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" gutterBottom>
          <Title>{t('settings.notifications', 'Notifications')}</Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">{t('settings.notificationMethod', 'Method')}</Typography>
      <NotificationMode />
    </Container>
  )
}
