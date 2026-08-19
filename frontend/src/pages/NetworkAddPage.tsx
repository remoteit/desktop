import React from 'react'
import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { NetworkAdd } from '../components/NetworkAdd'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

export const NetworkAddPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{t('networkAddPage.title', 'New network')}</Title>
        </Typography>
      }
    >
      <NetworkAdd />
    </Container>
  )
}
