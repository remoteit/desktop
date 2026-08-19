import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { ConnectedApps } from '../components/ConnectedApps'

export const ConnectedAppsPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>{t('connectedAppsPage.title', 'Connected Apps')}</Title>
          </Typography>
          <Gutters top={null} bottom="lg">
            <Typography variant="body2" color="textSecondary">
              {t(
                'connectedAppsPage.description',
                'Apps and AI agents you have signed in to your Remote.It account. Select one to limit which devices it can reach, or to revoke its access.'
              )}
            </Typography>
          </Gutters>
        </>
      }
    >
      <ConnectedApps />
    </Container>
  )
}
