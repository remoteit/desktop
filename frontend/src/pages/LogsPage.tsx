import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { EventList } from '../components/EventList'
import { EventHeader } from '../components/EventList/EventHeader'
import { Container } from '../components/Container'

export const LogsPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <>
          <Typography variant="h1">{t('logsPage.title', 'Logs')}</Typography>
          <EventHeader />
        </>
      }
    >
      <EventList />
    </Container>
  )
}
