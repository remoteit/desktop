import React from 'react'
import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { NetworkAdd } from '../components/NetworkAdd'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { useDeviceSessions } from '../hooks/useDeviceSessions'

export const NetworkAddPage: React.FC = () => {
  const { t } = useTranslation()
  const deviceSessions = useDeviceSessions()
  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>{t('networkAddPage.title', 'Create network')}</Title>
          </Typography>
          {deviceSessions && (
            <Gutters top={null} bottom="sm">
              <Typography variant="body2" color="textSecondary">
                {t(
                  'networkAddPage.intro',
                  'Devices in a network reach each other by name, with no connection to start. Name it, then add devices.'
                )}
              </Typography>
            </Gutters>
          )}
        </>
      }
    >
      <NetworkAdd />
    </Container>
  )
}
