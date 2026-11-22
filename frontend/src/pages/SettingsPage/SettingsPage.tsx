import React from 'react'
import { Box, List, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { State } from '../../store'
import { ListItemLocation } from '../../components/ListItemLocation'
import { selectLimitsLookup } from '../../selectors/organizations'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { TestUI } from '../../components/TestUI'
import { Title } from '../../components/Title'

export const SettingsPage: React.FC = () => {
  const preferences = useSelector((state: State) => state.backend)
  const feature = useSelector((state: State) => selectLimitsLookup(state))
  const { t } = useTranslation()

  if (!preferences) return null

  return (
    <Container
      gutterBottom
      header={
        <Box sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1 }}>
          <Typography variant="h2" component="h1">
            <Title>{t('settings.title', 'Settings')}</Title>
            <OutOfBand inline />
          </Typography>
        </Box>
      }
    >
      <List>
        <ListItemLocation
          title={t('settings.application', 'Application')}
          to="/settings/options"
          icon="browser"
          match={['/settings', '/settings/options']}
          exactMatch
          dense
        />
        {feature.tagging && (
          <ListItemLocation title={t('settings.tags', 'Tags')} to="/settings/tags" icon="tag" showDisabled dense />
        )}
        <ListItemLocation title={t('settings.graphs', 'Graphs')} to="/settings/graphs" icon="chart-column" dense />
        <ListItemLocation
          title={t('settings.notifications', 'Notifications')}
          to="/settings/notifications"
          icon="bell"
          dense
        />
        <ListItemLocation
          title={t('settings.connectionDefaults', 'Connection defaults')}
          to="/settings/defaults"
          icon="object-intersect"
          dense
        />
        <TestUI>
          <ListItemLocation title={t('settings.testSettings', 'Test settings')} to="/settings/test" icon="vial" dense />
        </TestUI>
      </List>
    </Container>
  )
}
